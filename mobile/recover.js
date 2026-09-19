const fs = require('fs');
const readline = require('readline');

async function recover() {
    const fileStream = fs.createReadStream('/Users/parth/.gemini/antigravity-cli/brain/e9c3a43a-e0aa-4377-8467-5e1cf2d31fe9/.system_generated/logs/transcript_full.jsonl');
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let lastAdminContent = null;
    let lastHomeContent = null;

    for await (const line of rl) {
        const entry = JSON.parse(line);
        if (entry.tool_calls) {
            for (const call of entry.tool_calls) {
                if (call.name === 'run_command' && call.args && call.args.CommandLine) {
                    const cmd = call.args.CommandLine;
                    
                    // Regex to extract content written to AdminDashboardScreen
                    const adminMatch = cmd.match(/cat << 'EOF' > [^\n]*AdminDashboardScreen\.jsx\n([\s\S]*?)\nEOF/);
                    if (adminMatch) {
                        lastAdminContent = adminMatch[1];
                    }

                    // Regex to extract content written to HomeScreen
                    const homeMatch = cmd.match(/cat << 'EOF' > [^\n]*HomeScreen\.jsx\n([\s\S]*?)\nEOF/);
                    if (homeMatch) {
                        lastHomeContent = homeMatch[1];
                    }
                }
                
                if (call.name === 'write_to_file' && call.args) {
                     if (call.args.TargetFile && call.args.TargetFile.endsWith('AdminDashboardScreen.jsx')) {
                         lastAdminContent = call.args.CodeContent;
                     }
                     if (call.args.TargetFile && call.args.TargetFile.endsWith('HomeScreen.jsx')) {
                         lastHomeContent = call.args.CodeContent;
                     }
                }
            }
        }
    }

    if (lastAdminContent) {
        fs.writeFileSync('/Users/parth/University/Classes/3rd semester/DSN/mobile/src/screens/admin/AdminDashboardScreen.jsx', lastAdminContent);
        console.log("Recovered AdminDashboardScreen.jsx");
    } else {
        console.log("Could not find AdminDashboardScreen.jsx in transcript");
    }

    if (lastHomeContent) {
        fs.writeFileSync('/Users/parth/University/Classes/3rd semester/DSN/mobile/src/screens/public/HomeScreen.jsx', lastHomeContent);
        console.log("Recovered HomeScreen.jsx");
    } else {
        console.log("Could not find HomeScreen.jsx in transcript");
    }
}

recover();
