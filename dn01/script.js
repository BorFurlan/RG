let dropbox;
let clear;
let preview;

let data;   // json modelov in scen
let files = [];

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
    console.log(files);
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

    console.log(files);
}

// Shrani json iz datoteke in izpise ime nalozene datoteke
function handleFiles(files) 
{
    let file = files[0];

    console.log(file.name.split("."));

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

            drawModel(data.models);
        }

    preview.appendChild(listItem); // Assuming that "preview" is the div output where the content will be displayed.
}


const deviceMatrix = 
[
    [512/2,    0,         512/2],
    [0,        -512/2,    512/2],
    [0,        0,          1   ]
]

const tmp = 
[
    [1,  2,  3],
    [2,  3,  4],
    [3,  4,  5]
];

const tmp1d = [1,  2,  3];

function drawLine([x0, y0], [x1, y1])
{
    // TODO matrika zaslonske preslikave
    // [-1, 1] -> [0, 512]

    multiplyMatrices(tmp, tmp1d);

    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
}

function drawModel(model)
{
    for (let i = 0; i < model.length; i++)
    {
        for (let j = 0; j < model[0].length; j++)
        {
            //console.log(model[i][j])
            drawLine(model[i][j][0], model[i][j][1]);
        }
    }
}

function multiplyMatrices(a, b)
{
    if (a[0].length != b.length)
    {
        console.log("Matriki ni mogoče zmnožiti");
        return;
    }

    c = [];

    for (let i = 0; i < a.length; i++)
    {
        c.push([]);
    }

    for (let i = 0; i < a.length; i++)
    {
        for (let j = 0; j < b.length; j++)
        {
            c[i].push(0);
        }
    }

    for (let i = 0; i < a[0].length; i++)
    {
        for (let j = 0; j < b.length; j++)
        {
            for (let k = 0; k < (b[0].length === undefined ? 1 : b[0].length); k++)
            {
                let aij = a[i][k];
                let bji = b[k][j];
                let mul = aij * bji;
                let fin = c[i][j] + mul;
                c[i][j] = c[i][j] + (a[i][k] * b[k][j]);
            }
        }
    }

    console.log("c");
    console.log(c);
}