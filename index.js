import express from "express";

const PORT = 9999;

const app = express();

const searchFormTemplate = `
    <form action="/artist-details" method="POST">
        <h2>Pesquisar Artista</h2>
    
        <label for="artist">🔍</label>
        <input id="artist" name="artist" type="text" />

        <input type="submit" value="Pesquisar" />
    </form>    
    <hr />
`;

app.use(express.urlencoded());
app.use(express.static("/"));

app.get("/", (req, res) => {
    res.send(searchFormTemplate);
});

app.post("/artist-search", async (req, res) => {
    const url = `https://api.vagalume.com.br/search.art?q=$${encodeURIComponent(req.body.artist)}&limit=5`;

    const artistResponse = await fetch(url);

    const artistData = await artistResponse.json();

    res.json(artistData);
});

app.post("/artist-details", async (req, res) => {
    const url = `https://www.vagalume.com.br/${sanitizeString(req.body.artist)}/index.js`;

    const artistDetailResponse = await fetch(url);

    const contentType = artistDetailResponse.headers.get("content-type");

    console.log("ok!", {
        body: req.body,
        url,
        contentType,
    });

    if (contentType === "application/json") {
        const { artist: data } = await artistDetailResponse.json();

        res.send(`
            ${searchFormTemplate}  

            <h1>${data.desc}</h1>

            <img width="300" height="300" src="https://www.vagalume.com.br${data.pic_medium}" />

            <div><h3>Rank #${data.rank.pos}<h3></div>

            <div>
                <h3>Estilos</h3> 
                <ul>${data.genre.map((g) => `<li>${g.name}</li>`).join("")}</ul>
            </div>

            <div>
                <h3>Albuns</h3>
                <ul>
                    ${data.albums.item.map((a) => `<li>${a.desc} - ${a.year}</li>`).join("")}
                </ul>
            </div>


            <div>
                <h3>Artistas Relacionados</h3>

                <ul>
                    ${data.related.map((r) => (r.name ? `<li>${r.name}</li>` : "")).join("")}
                </ul>
            </div>

            <div>
                <h3>Songs</h3>
                <ul>
                    ${data.lyrics.item.map((a) => `<li>${a.desc}</li>`).join("")}
                </ul>
            </div>

            <br />
            <hr />
            <br />

            <pre>
                <code>
                    ${JSON.stringify(data, null, 2)}
                </code>
            </pre>
        `);
    } else {
        res.send(`
            <h1>Não Encontrado</h1>
            <p>Não conseguimos encontrar "${req.body.artist}"</p>
            <p>Verifique erros de digitação e tente novamente</p>
        `);
    }
});

app.listen(PORT, () => {
    console.log(`listening on port ${PORT}`);
});

function sanitizeString(input) {
    // Remove accents from characters using Unicode normalization.
    const normalizedString = input.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    // Convert the string to lowercase and replace spaces with hyphens.
    const sanitizedString = normalizedString.toLowerCase().replace(/\s+/g, "-");

    return sanitizedString;
}
