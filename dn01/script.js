let dropbox;
let clear;
let preview;

let data;   // json modelov in scen
let files = [];

const tmp = 
[
    [1,  2,  3],
    [2,  3,  4],
    [3,  4,  5]
];

const tmp1d = [1,  2,  3];

dropbox = document.getElementById("drop-zone");
dropbox.addEventListener("dragenter", dragenter);
dropbox.addEventListener("dragover", dragover);
dropbox.addEventListener("drop", drop);

clear = document.getElementById("clear-btn");
clear.addEventListener("click", clearItems);

preview = document.getElementById("preview");

const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");

function clearItems(e)
{
    preview.textContent = "";
    files = [];
}

function dragenter(e) 
{
  e.stopPropagation();
  e.preventDefault();
}

function dragover(e) 
{
  e.stopPropagation();
  e.preventDefault();
}

function drop(e) 
{
    e.stopPropagation();
    e.preventDefault();

    if (files.length > 0)
    {
        alert("Največ ena json datoteka.")
        return;
    }

    const dt = e.dataTransfer;
    files = dt.files;

    handleFiles(files);
}

// Shrani json iz datoteke in izpise ime nalozene datoteke
function handleFiles(files) 
{
    let file = files[0];

    if (file.name.split(".")[1] != "json")
    {
        alert("Datoteka ni tipa .json");
        return;
    }

    const listItem = document.createElement("li");

    const reader = new FileReader();
    reader.readAsText(file);

    reader.onloadend = (event) => 
        {
            listItem.textContent = file.name; // set name for new li item
            data = JSON.parse(reader.result);
            console.log(data)

            // JSON se je naložil, lahko začnemo z izrisom
            drawScene(data);
        }

    preview.appendChild(listItem); // Assuming that "preview" is the div output where the content will be displayed.
}


const deviceMatrix = 
[
    [512/2,    0,         512/2],
    [0,        -512/2,    512/2],
    [0,        0,          1   ]
]

function drawLine([x0, y0], [x1, y1])
{
    let d1 = multiplyMatrices(deviceMatrix, [x0, y0, 1]);
    let d2 = multiplyMatrices(deviceMatrix, [x1, y1, 1]);

    let d1X = d1[0];
    let d1Y = d1[1];

    let d2X = d2[0];
    let d2Y = d2[1];

    ctx.beginPath();
    ctx.moveTo(d1X, d1Y);
    ctx.lineTo(d2X, d2Y);
    //ctx.rect(d1X, d1Y, 1, 1);
    //ctx.rect(d2X, d2Y, 1, 1);
    ctx.stroke();

    console.log([d1X, d1Y], [d2X, d2Y]);
}

// Draws a model with applied transformations
function drawModel(model, transformations)
{

    const transformMatrix = chainMultiplyMatrices(transformations[0], transformations.slice(1));
    let p1, p2;
    let d1, d2;
    for (let i = 0; i < model.length; i++)
    {
        p1 = model[i][0];
        p2 = model[i][1];

        d1 = multiplyMatrices(transformMatrix, [p1[0], p1[1], 1]);
        d2 = multiplyMatrices(transformMatrix, [p2[0], p2[1], 1]);

        drawLine([d1[0], d1[1]], [d2[0], d2[1]]);
    }
}

// Multiplies two given matrices
function multiplyMatrices(a, b)
{
    if (a[0].length != b.length)
    {
        console.log("Matriki ni mogoče zmnožiti");
        return;
    }

    c = [];
    let aik, bkj;

    // Preverimo, ali je matrika b 1D
    // Rabimo vedeti pri množenju in shranjevanju v novo matriko
    let isB1D = b[0].length === undefined;

    // Pripravimo končno matriko
    for (let i = 0; i < a.length; i++)
    {
        if (b[0].length === undefined)
        {
            c.push(0);
        } else 
        {
            c.push([]);
        }
    }

    for (let i = 0; i < a.length; i++)
    {
        for (let j = 0; j < (isB1D ? 0 : b[0].length); j++)
        {
            c[i].push(0);
        }
    }

    // Množenje matrik a in b
    for (let i = 0; i < a.length; i++)
    {
        for (let j = 0; j < (isB1D ? 1 : b[0].length); j++)
        {
            for (let k = 0; k < a[0].length; k++)
            {
                aik = a[i][k];
                bkj = (isB1D ? b[k] : b[k][j]);

                if (isB1D)
                {
                    c[i] = c[i] + (aik * bkj);    
                }
                else
                {
                    c[i][j] = c[i][j] + (aik * bkj);
                }
            }
        }
    }

    return c;
}

function scaleMatrix(factor)
{
    let factorX = factor[0];
    let factorY = factor[1];

    let scaleMatrix = 
    [
        [factorX,    0,         0],
        [0,          factorY,   0],
        [0,          0,         1]
    ];

    return scaleMatrix;
}

function translateMatrix(translate)
{
    let translateX = translate[0];
    let translateY = translate[1];

    let translateMatrix = 
    [
        [1,     0,      translateX],
        [0,     1,      translateY],
        [0,     0,      1         ]
    ];

    return translateMatrix;
}

function rotationMatrix(angle)
{
    let rotationMatrix = 
    [
        [Math.cos(angle),       -Math.sin(angle),       0],
        [Math.sin(angle),       Math.cos(angle),        0],
        [0,                     0,                      1]
    ];

    return rotationMatrix;
}

function drawScene(data)
{
    for (let i = 0; i < data.scene.length; i++)
    {

        let currentScene = data.scene[i];
        let transformations = [];

        // Gather all transformations for the current model
        for (let j = 0; j < currentScene.transforms.length; j++)
        {
            let currentTransform = currentScene.transforms[j];
            switch (currentTransform.type)
            {
                case "scale":
                    transformations.push(scaleMatrix(currentTransform.factor));
                    break;
                case "translate":
                    transformations.push(translateMatrix(currentTransform.vector));
                    break;
                case "rotate":
                    transformations.push(rotationMatrix(currentTransform.angle));
                    break;
            }
        }

        drawModel(data.models[currentScene.model], transformations);
    }
}

function chainMultiplyMatrices(matrix, chain)
{
    if (chain.length == 1)
    {
        let tmp = multiplyMatrices(chain[0], matrix)
        return multiplyMatrices(chain[0], matrix);
    }

    return chainMultiplyMatrices(multiplyMatrices(chain[0], matrix), chain.slice(1));
}