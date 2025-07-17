// Weather Service - Simple scheduled weather generation
// Generates weather data at 7:00 AM and 2:00 PM daily

class WeatherService {
    // Check and auto-submit missing reports at 11:00 PM EST
    startAutoSubmitSystem() {
        // Check every minute for 11:00 PM EST
        setInterval(() => {
            const now = new Date();
            // Convert to EST (UTC-5 or UTC-4 for DST)
            const utcHour = now.getUTCHours();
            const utcMonth = now.getUTCMonth();
            const isDST = (utcMonth > 2 && utcMonth < 10); // crude DST check: Apr-Oct
            const estHour = isDST ? utcHour - 4 : utcHour - 5;
            const estMinute = now.getUTCMinutes();
            if (estHour === 23 && estMinute === 0) {
                this.autoSubmitMissingReports();
            }
        }, 60000);
    }

    // Auto-submit minimal report for any project/date missing a report
    async autoSubmitMissingReports() {
        if (!this.sharePointAPI || !this.projectList || this.projectList.length === 0) {
            console.log('⚠️ Cannot auto-submit reports: Missing SharePoint API or project list');
            return;
        }
        const today = new Date();
        const reportDate = today.toISOString().split('T')[0];
        console.log('🤖 Checking for missing daily reports at 11:00 PM EST...');
        for (const project of this.projectList) {
            try {
                // Check if report exists for this project/date
                const exists = await this.sharePointAPI.checkReportExists(project.id, reportDate);
                if (!exists) {
                    // Generate weather for both morning and afternoon
                    const morningWeather = this.generateWeatherForZipCode(project.zipCode, '07:00');
                    const afternoonWeather = this.generateWeatherForZipCode(project.zipCode, '14:00');
                    const combinedWeatherData = {
                        ...morningWeather,
                        afternoonData: afternoonWeather,
                        summary: `Morning: ${morningWeather.temperature}°F, ${morningWeather.description} | Afternoon: ${afternoonWeather.temperature}°F, ${afternoonWeather.description}`
                    };
                    const reportData = {
                        projectId: project.id,
                        jobNumber: project.jobNumber,
                        superintendent: 'Auto-submitted (no user entry)',
                        reportDate,
                        siteVisitors: [],
                        subcontractors: [],
                        deliveries: [],
                        utilitiesOrdered: '',
                        utilitiesRemoved: '',
                        superintendentNotes: `Auto-submitted at 11:00 PM EST. No user entry.`,
                        weatherData: this.formatWeatherForSharePoint(combinedWeatherData),
                        createdBy: 'Auto Submit System',
                        isAutoSubmitted: true
                    };
                    await this.sharePointAPI.saveDailyReport(reportData);
                    console.log(`✅ Auto-submitted missing report for project ${project.jobNumber}`);
                }
            } catch (err) {
                console.error(`❌ Error auto-submitting for project ${project.jobNumber}:`, err);
            }
        }
        console.log('🤖 Auto-submit check complete.');
    }
    constructor() {
        this.dailyWeatherData = new Map(); // Store weather by date and time
        this.isRunning = false;
        this.projectList = []; // Store project list for automated reports
        this.sharePointAPI = null; // Reference to SharePoint API
    }

    // Start the weather generation system
    startWeatherSystem(projectList = [], sharePointAPI = null) {
        if (this.isRunning) return;
        
        console.log('🌤️ Starting weather generation system (7:00 AM & 2:00 PM)');
        this.isRunning = true;
        this.projectList = projectList;
        this.sharePointAPI = sharePointAPI;
        
        // Generate weather for today if not already done
        this.generateTodaysWeather();
        
        // Check every minute for weather generation times
        this.interval = setInterval(() => {
            this.checkAndGenerateWeather();
        }, 60000);
    }

    // Stop the weather system
    stopWeatherSystem() {
        if (this.interval) {
            clearInterval(this.interval);
            this.isRunning = false;
            console.log('🌤️ Weather system stopped');
        }
    }

    // Generate weather for today
    generateTodaysWeather() {
        const today = new Date().toDateString();
        const morningKey = `${today}-07:00`;
        const afternoonKey = `${today}-14:00`;
        
        // Generate morning weather if not exists
        if (!this.dailyWeatherData.has(morningKey)) {
            const morningWeather = this.generateWeatherForTime('07:00');
            this.dailyWeatherData.set(morningKey, morningWeather);
            console.log('� Generated 7:00 AM weather data');
        }
        
        // Generate afternoon weather if not exists
        if (!this.dailyWeatherData.has(afternoonKey)) {
            const afternoonWeather = this.generateWeatherForTime('14:00');
            this.dailyWeatherData.set(afternoonKey, afternoonWeather);
            console.log('☀️ Generated 2:00 PM weather data');
        }
    }

    // Check if it's time to generate new weather
    checkAndGenerateWeather() {
        const now = new Date();
        const currentTime = now.toTimeString().slice(0, 5); // HH:MM
        const today = now.toDateString();
        const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
        
        // Only generate on weekdays (Monday = 1, Friday = 5)
        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
            if (currentTime === '07:00') {
                const key = `${today}-07:00`;
                if (!this.dailyWeatherData.has(key)) {
                    const weather = this.generateWeatherForTime('07:00');
                    this.dailyWeatherData.set(key, weather);
                    console.log('🌅 Generated new 7:00 AM weather data');
                    
                    // Auto-generate daily reports for all projects
                    this.autoGenerateDailyReports();
                }
            } else if (currentTime === '14:00') {
                const key = `${today}-14:00`;
                if (!this.dailyWeatherData.has(key)) {
                    const weather = this.generateWeatherForTime('14:00');
                    this.dailyWeatherData.set(key, weather);
                    console.log('☀️ Generated new 2:00 PM weather data');
                }
            }
        }
    }

    // Generate weather data for a specific time
    generateWeatherForTime(time) {
        const now = new Date();
        const [hours, minutes] = time.split(':');
        const weatherTime = new Date(now);
        weatherTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        
        // Use current time as seed for consistent daily weather
        const seed = Math.floor(now.getTime() / (24 * 60 * 60 * 1000)); // Changes daily
        const timeSeed = time === '07:00' ? 1 : 2;
        
        let tempBase, tempRange;
        if (time === '07:00') {
            tempBase = 55; // Cooler in morning
            tempRange = 25;
        } else {
            tempBase = 75; // Warmer in afternoon
            tempRange = 25;
        }
        
        const temp = tempBase + ((seed * timeSeed) % tempRange);
        const conditionIndex = (seed * timeSeed) % 4;
        const conditions = ['Clear', 'Partly Cloudy', 'Cloudy', 'Light Rain'][conditionIndex];
        const descriptions = {
            'Clear': 'clear sky',
            'Partly Cloudy': 'few clouds', 
            'Cloudy': 'scattered clouds',
            'Light Rain': 'light rain'
        };

        return {
            temperature: temp,
            conditions: conditions,
            description: descriptions[conditions],
            humidity: 45 + ((seed * timeSeed) % 25), // 45-70%
            windSpeed: 5 + ((seed * timeSeed) % 12), // 5-17 mph
            scheduledTime: time,
            timestamp: weatherTime.toISOString(),
            isScheduled: true
        };
    }

    // Get weather for a zip code at current time preference
    getWeatherForZipCode(zipCode) {
        const now = new Date();
        const hour = now.getHours();
        const today = now.toDateString();
        
        let weatherTime;
        if (hour >= 14) {
            weatherTime = '14:00'; // Use afternoon weather after 2 PM
        } else if (hour >= 7) {
            weatherTime = '07:00'; // Use morning weather between 7 AM and 2 PM
        } else {
            weatherTime = '07:00'; // Use morning weather before 7 AM (previous day would be better, but keep simple)
        }
        
        const key = `${today}-${weatherTime}`;
        let weather = this.dailyWeatherData.get(key);
        
        if (!weather) {
            // Generate weather if not available
            weather = this.generateWeatherForTime(weatherTime);
            this.dailyWeatherData.set(key, weather);
        }
        
        // Add location info based on zip code
        return {
            ...weather,
            zipCode: zipCode,
            city: `City ${zipCode}`,
            location: `Zip ${zipCode}`
        };
    }

    // Auto-generate daily reports for all projects (weekdays only)
    async autoGenerateDailyReports() {
        if (!this.sharePointAPI || !this.projectList || this.projectList.length === 0) {
            console.log('⚠️ Cannot auto-generate reports: Missing SharePoint API or project list');
            return;
        }

        const today = new Date();
        const dayOfWeek = today.getDay();
        
        // Only generate on weekdays (Monday = 1, Friday = 5)
        if (dayOfWeek < 1 || dayOfWeek > 5) {
            console.log('⚠️ Auto-generation only runs Monday through Friday');
            return;
        }

        console.log('🤖 Starting automatic daily report generation for all projects...');

        try {
            for (const project of this.projectList) {
                if (!project.zipCode) continue;

                // Generate weather for both morning and afternoon
                const morningWeather = this.generateWeatherForZipCode(project.zipCode, '07:00');
                const afternoonWeather = this.generateWeatherForZipCode(project.zipCode, '14:00');

                // Create combined weather data
                const combinedWeatherData = {
                    ...morningWeather,
                    afternoonData: afternoonWeather,
                    summary: `Morning: ${morningWeather.temperature}°F, ${morningWeather.description} | Afternoon: ${afternoonWeather.temperature}°F, ${afternoonWeather.description}`
                };

                // Create automated daily report
                const reportData = {
                    projectId: project.id,
                    jobNumber: project.jobNumber,
                    superintendent: 'Automatically created for weather',
                    reportDate: today.toISOString().split('T')[0],
                    siteVisitors: [],
                    subcontractors: [],
                    deliveries: [],
                    utilitiesOrdered: '',
                    utilitiesRemoved: '',
                    superintendentNotes: `Automated weather report generated for ${today.toLocaleDateString()}. No site activity reported.`,
                    weatherData: this.formatWeatherForSharePoint(combinedWeatherData),
                    createdBy: 'Weather Automation System',
                    isAutoGenerated: true
                };

                // Save to SharePoint
                try {
                    await this.sharePointAPI.saveDailyReport(reportData);
                    console.log(`✅ Auto-generated weather report for project ${project.jobNumber}`);
                } catch (error) {
                    console.error(`❌ Failed to save auto-report for project ${project.jobNumber}:`, error);
                }

                // Add small delay between saves to avoid overwhelming SharePoint
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            console.log('🤖 Automatic daily report generation completed');
        } catch (error) {
            console.error('❌ Error during automatic report generation:', error);
        }
    }

    // Generate weather for a specific zip code and time
    generateWeatherForZipCode(zipCode, time) {
        const now = new Date();
        const [hours, minutes] = time.split(':');
        const weatherTime = new Date(now);
        weatherTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        
        // Use zip code as additional seed for location-specific weather
        const zipSeed = zipCode.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const dateSeed = Math.floor(now.getTime() / (24 * 60 * 60 * 1000));
        const timeSeed = time === '07:00' ? 1 : 2;
        const seed = (dateSeed + zipSeed) * timeSeed;
        
        let tempBase, tempRange;
        if (time === '07:00') {
            tempBase = 55; // Cooler in morning
            tempRange = 25;
        } else {
            tempBase = 75; // Warmer in afternoon
            tempRange = 25;
        }
        
        const temp = tempBase + (seed % tempRange);
        const conditionIndex = seed % 4;
        const conditions = ['Clear', 'Partly Cloudy', 'Cloudy', 'Light Rain'][conditionIndex];
        const descriptions = {
            'Clear': 'clear sky',
            'Partly Cloudy': 'few clouds', 
            'Cloudy': 'scattered clouds',
            'Light Rain': 'light rain'
        };

        return {
            temperature: temp,
            conditions: conditions,
            description: descriptions[conditions],
            humidity: 45 + (seed % 25), // 45-70%
            windSpeed: 5 + (seed % 12), // 5-17 mph
            zipCode: zipCode,
            city: `City ${zipCode}`,
            location: `Zip ${zipCode}`,
            scheduledTime: time,
            timestamp: weatherTime.toISOString(),
            isScheduled: true,
            isAutoGenerated: true
        };
    }

    // Format weather for SharePoint storage
    formatWeatherForSharePoint(weatherData) {
        // Handle combined weather data with both morning and afternoon
        if (weatherData.afternoonData) {
            return JSON.stringify({
                morningTemperature: `${weatherData.temperature}°F`,
                morningConditions: weatherData.conditions,
                morningDescription: weatherData.description,
                morningHumidity: `${weatherData.humidity}%`,
                morningWindSpeed: `${weatherData.windSpeed} mph`,
                afternoonTemperature: `${weatherData.afternoonData.temperature}°F`,
                afternoonConditions: weatherData.afternoonData.conditions,
                afternoonDescription: weatherData.afternoonData.description,
                afternoonHumidity: `${weatherData.afternoonData.humidity}%`,
                afternoonWindSpeed: `${weatherData.afternoonData.windSpeed} mph`,
                location: weatherData.location || weatherData.city,
                zipCode: weatherData.zipCode,
                morningTime: '07:00',
                afternoonTime: '14:00',
                timestamp: weatherData.timestamp,
                summary: weatherData.summary
            });
        } else {
            // Handle single weather reading (backwards compatibility)
            return JSON.stringify({
                temperature: `${weatherData.temperature}°F`,
                conditions: weatherData.conditions,
                description: weatherData.description,
                humidity: `${weatherData.humidity}%`,
                windSpeed: `${weatherData.windSpeed} mph`,
                location: weatherData.location || weatherData.city,
                zipCode: weatherData.zipCode,
                scheduledTime: weatherData.scheduledTime,
                timestamp: weatherData.timestamp,
                summary: `${weatherData.temperature}°F, ${weatherData.description} (${weatherData.scheduledTime})`
            });
        }
    }

    // Get weather summary for display
    getWeatherSummary(weatherData) {
        const timeLabel = weatherData.scheduledTime === '07:00' ? '7:00 AM' : '2:00 PM';
        return `${weatherData.temperature}°F, ${weatherData.description} (${timeLabel})`;
    }
}

export default new WeatherService();
