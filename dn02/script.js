// JS za 2.dn pri RG
// Bor Furlan

// Viri:
// https://developer.mozilla.org/en-US/docs/Web/API/FileReader
// https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API/File_drag_and_drop

let dropbox;
let clear;
let preview;

let data;
let files = [];

let bezierCurves = [];
let zlepki = [];

const NEAR = 20;
let isDragging = false;
let closestPoint = null;

// Priprava za drag&drop
dropbox = document.getElementById("drop-zone");
dropbox.addEventListener("dragenter", dragenter);
dropbox.addEventListener("dragover", dragover);
dropbox.addEventListener("drop", drop);

clear = document.getElementById("clear-btn");
clear.addEventListener("click", clearItems);

preview = document.getElementById("preview");

let gumbC0 = document.getElementById("gumbC0");
gumbC0.addEventListener("click", zveznostC0);

let gumbC1 = document.getElementById("gumbC1");
gumbC1.addEventListener("click", zveznostC1);

let gumbC0Zlepki = document.getElementById("gumbC0Zlepki");
gumbC0Zlepki.addEventListener("click", zveznostC0Zlepki);

let gumbC1Zlepki = document.getElementById("gumbC1Zlepki");
gumbC1Zlepki.addEventListener("click", zveznostC1Zlepki);

const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");

canvas.addEventListener("mousedown", (function(e){handleMouseDown(e);}));
canvas.addEventListener("mousemove", (function(e){handleMouseMove(e);}));
canvas.addEventListener("mouseup",   (function(e){handleMouseUp(e);}));

function clearItems(e)
{
    preview.textContent = "";
    files = [];

    bezierCurves = [];
    zlepki = [];

    clearCanvas(ctx);
}

function handleMouseDown(e)
{
    mouseX = e.pageX - canvas.offsetLeft;
    mouseY = e.pageY - canvas.offsetTop;

    let distance = canvas.height;

    // Ali je blizu kakšna točka?
    for (let i = 0; i < bezierCurves.length; i++)
    {
        let currCurve = bezierCurves[i];
        
        // Poglej, če je katera točka dovolj blizu za premik

        let x = pointDistance([mouseX, mouseY], currCurve.p0);
        if (x <= NEAR &&  x < distance)
        {
            closestPoint = currCurve.p0;
            distance = x;
        }

        x = pointDistance([mouseX, mouseY], currCurve.p1);
        if (x <= NEAR && x < distance)
        {
            closestPoint = currCurve.p1;
            distance = x;
        }

        x = pointDistance([mouseX, mouseY], currCurve.p2);
        if (x <= NEAR && x < distance)
        {
            closestPoint = currCurve.p2;
            distance = x;
        }

        x = pointDistance([mouseX, mouseY], currCurve.p3);
        if (x <= NEAR && x < distance)
        {
            closestPoint = currCurve.p3;
            distance = x;
        }

        if (x <= NEAR && x < distance)
        {
            distance = x;
            closestPoint = currCurve[j];
            console.log("select");
        }
    }

    if (closestPoint != null)
    {
        isDragging = true;
    }
}

function handleMouseMove(e)
{
    mouseX = e.pageX - canvas.offsetLeft;
    mouseY = e.pageY - canvas.offsetTop;

    if (isDragging && closestPoint != null)
    {
        closestPoint[0] = mouseX;
        closestPoint[1] = mouseY;

        clearCanvas();
        bezierCurves.forEach(curve => curve.drawCubic());
    }
}

function handleMouseUp(e)
{
    isDragging = false;
    closestPoint = null;
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

    reader.readAsText(file); // Preberemo vsebino nalozene datoteke
    
    reader.onloadend = (event) => 
        {
            listItem.textContent = file.name; // nastavi ime novega li elementa

            data = JSON.parse(reader.result);
            console.log(data);

            // Vsebina datoteke se je prebrala, prični z risanjem krivulj
            drawBezierCurves(data);
            nastaviZlepke(data);
        }

    preview.appendChild(listItem); // Prikazi ime nalozene datoteke
}

function zveznostC0()
{
    if (bezierCurves.length == 0)
    {
        console.log("C0: Ni krivulj");
        return;
    }

    for (let i = 0; i < bezierCurves.length - 1; i++)
    {
        bezierCurves[i].p3 = bezierCurves[i + 1].p0
    }

    clearCanvas();
    bezierCurves.forEach(curve => curve.drawCubic());
}

function zveznostC1()
{
    if (bezierCurves.length == 0)
    {
        console.log("C1: Ni krivulj");
        return;
    }
    
    zveznostC0();

    // Zveznost C1 način: enak y
    /*for (let i = 0; i < bezierCurves.length - 1; i++)
    {
        bezierCurves[i].p2[1] = bezierCurves[i].p3[1];
        bezierCurves[i + 1].p1[1] = bezierCurves[i].p2[1]
    } */

    // Zveznost C1 način: premica
    for (let i = 0; i < bezierCurves.length - 1; i++)
    {
        let currCurve = bezierCurves[i];
        let nextCurve = bezierCurves[i + 1];

        let xPlus = nextCurve.p0[0] - currCurve.p2[0];
        let yPlus = nextCurve.p0[1] - currCurve.p2[1];
        
        // Nastavi p1 naslednje krivulje glede na p2 prejšnje krivulje
        // Če bi kontrolna točka pri C1 šla izven platna, se ustavi na robu. Pri tem se lahko pokvari zveznost C1
        // Če ne želimo ustavljanja na robu, izberemo vrstici za naslednjima
        //nextCurve.p1[0] = Math.min(canvas.width  * 0.98, Math.max(0, nextCurve.p0[0] + xPlus)); 
        //nextCurve.p1[1] = Math.min(canvas.height * 0.98, Math.max(0, nextCurve.p0[1] + yPlus)); 

        nextCurve.p1[0] = nextCurve.p0[0] + xPlus; 
        nextCurve.p1[1] = nextCurve.p0[1] + yPlus; 
    }

    clearCanvas();
    bezierCurves.forEach(curve => curve.drawCubic());
}

function zveznostC0Zlepki()
{
    if (zlepki.length == 0)
    {
        console.log("Zlepki C0: ni zlepkov");
        return;
    }

    for (let i = 0; i < zlepki.length; i++)
    {
        for (let j = 0; j < zlepki[i].curves.length - 1; j++)
        {
            let currCurve = zlepki[i].curves[j];
            let nextCurve = zlepki[i].curves[j + 1];

            currCurve.p3 = nextCurve.p0;
        }
    }

    clearCanvas();
    //zlepki.forEach(z => z.curves.forEach(k => k.drawCubic()));
    zlepki.forEach(z => z.narisiZlepek());
}

function zveznostC1Zlepki()
{
    if (zlepki.length == 0)
    {
        console.log("Zlepki C1: ni zlepkov");
        return;
    }

    zveznostC0Zlepki();

    for (let i = 0; i < zlepki.length; i++)
    {
        for (let j = 0; j < zlepki[i].curves.length - 1; j++)
        {
            let currCurve = zlepki[i].curves[j];
            let nextCurve = zlepki[i].curves[j + 1];

            let xPlus = nextCurve.p0[0] - currCurve.p2[0];
            let yPlus = nextCurve.p0[1] - currCurve.p2[1];

            // OPOMBA: ce bi kontrolna tocka pri C1 sla izven platna, se ustavi. Pri tem se lahko pokvari zveznost C1.
            // Ce tega ne zelimo, izbrisemo min in max
            //nextCurve.p1[0] = Math.min(canvas.width  * 0.98, Math.max(0, nextCurve.p0[0] + xPlus));
            //nextCurve.p1[1] = Math.min(canvas.height * 0.98, Math.max(0, nextCurve.p0[1] + yPlus));

            nextCurve.p1[0] = nextCurve.p0[0] + xPlus;
            nextCurve.p1[1] = nextCurve.p0[1] + yPlus;
        }
    }

    clearCanvas();
    zlepki.forEach(z => z.narisiZlepek());
}

function clearCanvas()
{
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// Narise crto od (x0, y0) do (x1, y1)
function drawLine([x0, y0], [x1, y1])
{
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
}

function drawPoint([x, y])
{
    ctx.beginPath();
    ctx.fillRect(x,y,1,1);
    ctx.stroke();
}

function drawBezierCurves(data)
{
    for (let i = 0; i < data.krivulje.length; i++)
    {
        bezierCurves.push(new CubicBezier(data.krivulje[i]));
    }

   bezierCurves.forEach(curve => curve.drawCubic());
}

function nastaviZlepke(data)
{
    for (let i = 0; i < data.zlepki.length; i++)
    {
        zlepki.push(new BezierZlepek(data.zlepki[i]));
    }
}

class CubicBezier 
{
    
    constructor(controlPoints) 
    {

    if (controlPoints.length != 4)
    {
        alert("rabim 4 tocke");
    }

    this.p0 = controlPoints[0];
    this.p1 = controlPoints[1];
    this.p2 = controlPoints[2];
    this.p3 = controlPoints[3];
    }

    drawCubic(context)
    {
        let points = [];
        let distanceSum = pointDistance(this.p0, this.p1) + pointDistance(this.p1, this.p2) + pointDistance(this.p2, this.p3);

        // Interpolacija točk krivulje
        for (let t = 0; t <= 1; t = t + (1 / distanceSum))
        {
            points.push(lerp([this.p0, this.p1, this.p2, this.p3], t));
        }

        // Izris interpoliranih točk
        for (let i = 0; i < points.length; i++)
        {
            drawPoint(points[i]);
        }

        // Narišemo ročke kontrolnih točk
        this.drawHandles();
    }

    drawHandles()
    {
        const pointSize = 6;
        const pointRadius = 4;

        ctx.beginPath();

        // Control points
        ctx.roundRect(this.p0[0], this.p0[1], pointSize, pointSize, pointRadius);
        ctx.roundRect(this.p1[0], this.p1[1], pointSize, pointSize, pointRadius);
        ctx.roundRect(this.p2[0], this.p2[1], pointSize, pointSize, pointRadius);
        ctx.roundRect(this.p3[0], this.p3[1], pointSize, pointSize, pointRadius);

        ctx.fill();

        ctx.beginPath();
        ctx.setLineDash([5,7]);

        // Control points handle bars
        ctx.moveTo(this.p0[0], this.p0[1]);
        ctx.lineTo(this.p1[0], this.p1[1]);

        ctx.moveTo(this.p2[0], this.p2[1]);
        ctx.lineTo(this.p3[0], this.p3[1]);

        ctx.stroke();
    }
}

class BezierZlepek
{
    constructor(indexes)
    {
        this.curves = [];
        indexes.forEach(index => this.curves.push(bezierCurves[index]));

        this.prva = this.curves[0];
        this.zadnja = this.curves[1];
    }

    narisiZlepek()
    {
        this.curves.forEach(curve => curve.drawCubic());
    }
}

function pointDistance(p0, p1)
{
    return Math.sqrt(Math.pow(p1[0] - p0[0], 2) + Math.pow(p1[1] - p0[1], 2));
}

function deepCopy(inputArray) {
	const copy = [];
	inputArray.forEach((item) => {
		if (Array.isArray(item)) {
			copy.push(deepCopy(item));
		} else {
			copy.push(item);
		}
	});
	return copy;
}

function mul(num, array)
{
    out = deepCopy(array); 

    for (let i = 0; i < out.length; i++)
    {
        out[i] = out[i] * num;
    }

    return out;
}

function add(arrays)
{
    for (let i = 0; i < arrays.length - 1; i++)
    {
        if (arrays[i].length != arrays[i + 1].length)
        {
            alert("Add: tabeli nista iste dolžine");
        }
    }

    let c = [];

    for (let i = 0; i < arrays[0].length; i++)
    {
        c.push(0);
    }

    for (let i = 0; i < arrays.length; i++)
    {
        for (let j = 0; j < arrays[0].length; j++)
        {
            c[j] = c[j] + arrays[i][j];
        }
    }

    return c;
}

function lerp(points, t)
{
    if (points.length == 2)
    {
        return add([mul((1 - t), points[0]), mul(t, points[1])]);
    }

    if (points.length == 3)
    {
        return add([mul((1 - t), lerp([points[0], points[1]], t)), mul(t, lerp([points[1], points[2]], t))]);
    }

    if (points.length == 4)
    {
        return add([mul((1 - t), lerp([points[0], points[1], points[2]], t)), mul(t, lerp([points[1], points[2], points[3]], t))]);
    }

    console.log("Lerp: neveljavno število točk");
}