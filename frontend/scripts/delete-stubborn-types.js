const fs = require('fs');
const path = 'c:\\Users\\Asus\\Desktop\\Projects\\VocabMobileApp\\frontend\\node_modules\\@types\\uuid';
try {
    if (fs.existsSync(path)) {
        fs.rmSync(path, { recursive: true, force: true });
        console.log('Successfully deleted ' + path);
    } else {
        console.log('Path does not exist: ' + path);
    }
} catch (err) {
    console.error('Error deleting path:', err);
}
