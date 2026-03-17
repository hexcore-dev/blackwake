function setTray() {
    if(NL_MODE != "window") {
        console.log("INFO: Tray menu is only available in the window mode.");
        return;
    }

    let tray = {
        icon: "/resources/icons/trayIcon.png",
        menuItems: [
            {id: "VERSION", text: "Get version"},
            {id: "SEP", text: "-"},
            {id: "QUIT", text: "Quit"}
        ]
    };

    Neutralino.os.setTray(tray);
}

function onTrayMenuItemClicked(event) {
    switch(event.detail.id) {
        case "VERSION":
            Neutralino.os.showMessageBox("Version information",
                `Neutralinojs server: v${NL_VERSION} | Neutralinojs client: v${NL_CVERSION}`);
            break;
        case "QUIT":
            Neutralino.app.exit();
            break;
    }
}

function onWindowClose() {
    Neutralino.app.exit();
}

Neutralino.init();

Neutralino.events.on("trayMenuItemClicked", onTrayMenuItemClicked);
Neutralino.events.on("windowClose", onWindowClose);

if(NL_OS != "Darwin") {
    setTray();
}

/* ====================== */
function GetAppDataSavesPath() {
    return new Promise((resolve, reject) => {
        Neutralino.os.getEnv("LOCALAPPDATA").then(data => {
            return resolve(`${data}\\Daedalic Entertainment GmbH\\Barotrauma`);
        });
    });
}

function ListSaveFiles(dir) {
    return new Promise(async (resolve, reject) => {
        const entries = await Neutralino.filesystem.readDirectory(dir, {
            recursive: true
        });

        const files = [];
        for (const file of entries) {
            if (file.type === "FILE" && file.entry.toLowerCase().endsWith(".save")) {
                files.push(file.entry);
            }
        }

        return resolve(files);
    })
}

function ReadSaveFile(filePath) {
    return new Promise(async (resolve, reject) => {
        const buffer = await Neutralino.filesystem.readBinaryFile(filePath);

        return resolve(new Uint8Array(buffer));
    });
}

async function GunzipNative(uint8) {
    const ds = new DecompressionStream("gzip");
    const stream = new Blob([uint8]).stream().pipeThrough(ds);

    const buffer = await new Response(stream).arrayBuffer();

    return new Uint8Array(buffer);
}

function ParseSaveContainer(bytes) {
    const reader = new BinaryReader(bytes);
    const entries = [];

    while (!reader.eof()) {
        if (reader.offset + 4 > reader.bytes.length) break;

        const nameLength = reader.readU32LE();

        if (nameLength === 0) break;

        const name = reader.readUTF16LEString(nameLength);
        const contentLength = reader.readU32LE();
        const content = reader.readBytes(contentLength);

        entries.push({
            name,
            contentLength,
            content
        });
    }

    return entries;
}

GetAppDataSavesPath().then(data => {
    ListSaveFiles(data).then(saves => {
        console.log(saves)
        const save = `${data}\\${saves.find(item => item === "Test.save")}`;

        ReadSaveFile(save).then(async binary => {
            const content = await GunzipNative(binary);
            const entries = ParseSaveContainer(content);

            console.log(entries);

            const xmlEntry = entries.find(e => e.name === "gamesession.xml");
            if (xmlEntry) {
                const xmlText = new TextDecoder("utf-8").decode(xmlEntry.content);
                console.log(xmlText);
            }
        });
    });
});