// Drop handler function to get all files
async function getAllFileEntries(dataTransferItemList) {
    let fileEntries = [];
    // Use BFS to traverse entire directory/file structure
    let queue = [];
    // Unfortunately dataTransferItemList is not iterable i.e. no forEach
    for (let i = 0; i < dataTransferItemList.length; i++) {
        queue.push(dataTransferItemList[i].webkitGetAsEntry());
    }
    while (queue.length > 0) {
        let entry = queue.shift();
        if (entry.isFile) {
            fileEntries.push(entry);
        } else if (entry.isDirectory) {
            let reader = entry.createReader();
            queue.push(...await readAllDirectoryEntries(reader));
        }
    }
    return fileEntries;
}

// Get all the entries (files or sub-directories) in a directory by calling readEntries until it returns empty array
async function readAllDirectoryEntries(directoryReader) {
    let entries = [];
    let readEntries = await readEntriesPromise(directoryReader);
    while (readEntries.length > 0) {
        entries.push(...readEntries);
        readEntries = await readEntriesPromise(directoryReader);
    }
    return entries;
}

// Wrap readEntries in a promise to make working with readEntries easier
async function readEntriesPromise(directoryReader) {
    try {
        return await new Promise((resolve, reject) => {
            directoryReader.readEntries(resolve, reject);
        });
    } catch (err) {
        console.log(err);
    }
}

async function toImage(file) {
    return new Promise((resolve, reject) => {
        file.file((f) => {
            file.file((f) => {
                var reader = new FileReader();
                reader.readAsDataURL(f);
                reader.addEventListener("load", function () {
                    const img = new Image();
                    img.src = reader.result;
                    img.onload = (a) => {
                        resolve(img);
                    }
                }, false);
            });
        });
    });
}
async function dropHandler(event) {
    event.preventDefault();
    let items = await getAllFileEntries(event.dataTransfer.items);
    items.sort((a, b) => (a.name > b.name ? 1 : -1))
    return Promise.all(items.map(toImage));
}

["dragenter", "dragover", "dragleave", "drop"].forEach(eventName => {
    document.body.addEventListener(eventName, preventDefaults, false)
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}
function Settings() {
    this.cellWidth = 32;
    this.cellHeight = 32;
    this.column = 5;
}
const settings = new Settings();
var gui = new dat.GUI();


gui.add(settings, 'cellWidth');
gui.add(settings, 'cellHeight');
gui.add(settings, 'column');

document.body.addEventListener("drop", async function (e) {
    const canvas = document.createElement("canvas");

    document.body.appendChild(canvas);

    const cell = {
        w: settings.cellWidth,
        h: settings.cellHeight,
    }
    const itemInCol = settings.column;

    const items = await dropHandler(e);

    const ctx = canvas.getContext('2d');

    canvas.width = itemInCol * cell.w;
    canvas.height = Math.ceil(items.length / itemInCol) * cell.h;
    document.body.style.backgroundSize = `${cell.w * 2}px ${cell.h * 2}px`

    items.forEach(function (img, index) {
        const col = index % itemInCol;
        const row = Math.floor(index / itemInCol);
        const x = (col * cell.w) + (Math.floor(cell.w - img.width) * 0.5);
        const y = (row * cell.h) + (Math.floor(cell.h - img.height));
        ctx.drawImage(img, x, y, img.width, img.height);
    });
}
    , false);
