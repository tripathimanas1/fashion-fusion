#!/usr/bin/env node
/**
 * Frontend health check for FashionFusion application
 * Validates dependencies, configuration, and basic functionality
 */

const fs = require('fs');
const path = require('path');

function checkNodeVersion() {
    console.log('🟢 Checking Node.js version...');
    const version = process.version;
    const major = parseInt(version.slice(1).split('.')[0]);
    
    if (major < 18) {
        console.log(`❌ Node.js ${version} detected. Requires Node.js 18+`);
        return false;
    }
    
    console.log(`✅ Node.js ${version} - OK`);
    return true;
}

function checkPackageJson() {
    console.log('\n📦 Checking package.json...');
    
    if (!fs.existsSync('package.json')) {
        console.log('❌ package.json not found');
        return false;
    }
    
    try {
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        
        const requiredDeps = [
            'next',
            'react',
            'react-dom',
            'axios'
        ];
        
        const missingDeps = requiredDeps.filter(dep => !packageJson.dependencies[dep]);
        
        if (missingDeps.length > 0) {
            console.log(`❌ Missing dependencies: ${missingDeps.join(', ')}`);
            return false;
        }
        
        console.log('✅ package.json is valid');
        return true;
    } catch (error) {
        console.log(`❌ Invalid package.json: ${error.message}`);
        return false;
    }
}

function checkNodeModules() {
    console.log('\n📁 Checking node_modules...');
    
    if (!fs.existsSync('node_modules')) {
        console.log('❌ node_modules not found');
        console.log('Run: npm install');
        return false;
    }
    
    const requiredPackages = [
        'next',
        'react',
        'axios',
        'tailwindcss'
    ];
    
    const missingPackages = requiredPackages.filter(pkg => 
        !fs.existsSync(path.join('node_modules', pkg))
    );
    
    if (missingPackages.length > 0) {
        console.log(`❌ Missing packages: ${missingPackages.join(', ')}`);
        console.log('Run: npm install');
        return false;
    }
    
    console.log('✅ All required packages installed');
    return true;
}

function checkEnvironmentFile() {
    console.log('\n🔧 Checking environment configuration...');
    
    const envFiles = ['.env.local', '.env'];
    const envFile = envFiles.find(file => fs.existsSync(file));
    
    if (!envFile) {
        console.log('❌ No environment file found');
        console.log('Create .env.local from .env.local.example');
        return false;
    }
    
    console.log(`✅ Environment file found: ${envFile}`);
    return true;
}

function checkNextConfig() {
    console.log('\n⚙️ Checking Next.js configuration...');
    
    if (!fs.existsSync('next.config.js')) {
        console.log('❌ next.config.js not found');
        return false;
    }
    
    try {
        // Basic validation - check if file is readable
        const config = fs.readFileSync('next.config.js', 'utf8');
        if (!config.includes('module.exports')) {
            console.log('❌ Invalid next.config.js format');
            return false;
        }
        
        console.log('✅ Next.js configuration is valid');
        return true;
    } catch (error) {
        console.log(`❌ Error reading next.config.js: ${error.message}`);
        return false;
    }
}

function checkTailwindConfig() {
    console.log('\n🎨 Checking Tailwind CSS configuration...');
    
    if (!fs.existsSync('tailwind.config.js')) {
        console.log('❌ tailwind.config.js not found');
        return false;
    }
    
    try {
        const config = fs.readFileSync('tailwind.config.js', 'utf8');
        if (!config.includes('module.exports')) {
            console.log('❌ Invalid tailwind.config.js format');
            return false;
        }
        
        console.log('✅ Tailwind CSS configuration is valid');
        return true;
    } catch (error) {
        console.log(`❌ Error reading tailwind.config.js: ${error.message}`);
        return false;
    }
}

function checkPagesDirectory() {
    console.log('\n📄 Checking pages structure...');
    
    if (!fs.existsSync('pages')) {
        console.log('❌ pages directory not found');
        return false;
    }
    
    const requiredFiles = [
        'pages/_app.js',
        'pages/index.js'
    ];
    
    const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));
    
    if (missingFiles.length > 0) {
        console.log(`❌ Missing required files: ${missingFiles.join(', ')}`);
        return false;
    }
    
    console.log('✅ Pages structure is valid');
    return true;
}

function checkComponentsDirectory() {
    console.log('\n🧩 Checking components directory...');
    
    if (!fs.existsSync('components')) {
        console.log('❌ components directory not found');
        return false;
    }
    
    // Check if components directory has content
    const components = fs.readdirSync('components');
    if (components.length === 0) {
        console.log('⚠️ Components directory is empty');
    } else {
        console.log(`✅ Found ${components.length} component(s)`);
    }
    
    return true;
}

function checkStylesDirectory() {
    console.log('\n🎭 Checking styles directory...');
    
    if (!fs.existsSync('styles')) {
        console.log('❌ styles directory not found');
        return false;
    }
    
    const globalsCss = 'styles/globals.css';
    if (!fs.existsSync(globalsCss)) {
        console.log('❌ globals.css not found in styles directory');
        return false;
    }
    
    console.log('✅ Styles directory is valid');
    return true;
}

function checkPortAvailability() {
    console.log('\n🌐 Checking port availability...');
    
    const http = require('http');
    const port = 3000;
    
    const server = http.createServer();
    
    return new Promise((resolve) => {
        server.listen(port, () => {
            server.close(() => {
                console.log(`✅ Port ${port} is available`);
                resolve(true);
            });
        });
        
        server.on('error', () => {
            console.log(`⚠️ Port ${port} is already in use`);
            console.log('You may need to use a different port or stop the existing process');
            resolve(true); // Don't fail the check, just warn
        });
    });
}

async function main() {
    console.log('🏥 FashionFusion Frontend Health Check Starting...');
    console.log('='.repeat(50));
    
    const checks = [
        ('Node Version', checkNodeVersion),
        ('Package JSON', checkPackageJson),
        ('Node Modules', checkNodeModules),
        ('Environment File', checkEnvironmentFile),
        ('Next Config', checkNextConfig),
        ('Tailwind Config', checkTailwindConfig),
        ('Pages Directory', checkPagesDirectory),
        ('Components Directory', checkComponentsDirectory),
        ('Styles Directory', checkStylesDirectory),
        ('Port Availability', checkPortAvailability),
    ];
    
    let passed = 0;
    let failed = 0;
    
    for (const [checkName, checkFunc] of checks) {
        try {
            const result = await checkFunc();
            if (result) {
                passed += 1;
            } else {
                failed += 1;
            }
        } catch (error) {
            console.log(`❌ ${checkName} check crashed: ${error.message}`);
            failed += 1;
        }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('🏥 Frontend Health Check Complete');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    
    if (failed === 0) {
        console.log('\n🎉 All frontend checks passed!');
        console.log('You can now start the frontend with: npm run dev');
        process.exit(0);
    } else {
        console.log(`\n⚠️ ${failed} check(s) failed. Please fix issues before starting.`);
        process.exit(1);
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { main };
