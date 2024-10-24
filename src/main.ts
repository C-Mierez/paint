import "./style.css";
import { CanvasMode, LayerState, LayerType, type CanvasState } from "./types";
import { $ } from "./utils";

// Constants
enum Tools {
    Draw,
    Erase,
    Ellipse,
    Rectangle,
    Fill,
    Picker,
    Trash,
    Save,
}
const Buttons = [
    {
        label: "Drawing with Pencil",
        icon: "/icons/draw.png",
        action: Tools.Draw,
    },
    {
        label: "Erasing",
        icon: "/icons/erase.png",
        action: Tools.Erase,
    },
    {
        label: "Ellipse Tool",
        icon: "/icons/ellipse.png",
        action: Tools.Ellipse,
    },
    {
        label: "Rectangle Tool",
        icon: "/icons/rectangle.png",
        action: Tools.Rectangle,
    },
    {
        label: "Fill",
        icon: "/icons/fill.png",
        action: Tools.Fill,
    },
    {
        label: "Color Picker",
        icon: "/icons/picker.png",
        action: Tools.Picker,
    },
    {
        label: "Clear Canvas",
        icon: "/icons/trash.png",
        action: Tools.Trash,
    },
    {
        label: "Save Drawing",
        icon: "/icons/save.png",
        action: Tools.Save,
    },
];

const ColorSwatches = [
    "#000000",
    "#FFFFFF",
    "#818080",
    "#C1BEC1",
    "#7D0201",
    "#EE0706",
    "#7E7E00",
    "#F6F706",
    "#078102",
    "#02FC07",
    "#027B77",
    "#01FCFD",
    "#07017B",
    "#0004FB",
    "#790283",
    "#FA03FC",
    "#828042",
    "#FEFC85",
    "#044343",
    "#03FD81",
    "#067FF3",
    "#82FDFC",
    "#004082",
    "#7E7EF8",
    "#3E03FD",
    "#F40481",
    "#833B01",
    "#FD8344",
];

// Elements
const $canvas = $("#canvas") as HTMLCanvasElement;
const $colorPicker = $("#color-picker") as HTMLInputElement;
const $colorSwatch = $("#color-swatch") as HTMLUListElement;
const $toolsList = $("aside ul") as HTMLUListElement;
const $canvasContainer = $("#canvas-container") as HTMLDivElement;
const $canvasResizer = $("#canvas-resizer") as HTMLDivElement;
const $cursor = $("#cursor") as HTMLDivElement;
const $sizeIndicator = $("#size") as HTMLDivElement;
const $toolIndicator = $("#tool") as HTMLDivElement;
const $dimensionsIndicator = $("#dimensions") as HTMLDivElement;

const ctx = $canvas.getContext("2d") as CanvasRenderingContext2D;

// State
let selectedTool: Tools;
let canvasState: CanvasState;
let selectedColor;
let strokeWidth = 2;
let layerState: LayerState;
let imageData: ImageData;

// Functions
function start() {
    canvasState = {
        mode: CanvasMode.None,
    };

    selectedColor = "#000000";
    const $container = $("#color-bar > li:first-child") as HTMLLIElement;
    $container.style.backgroundColor = selectedColor;

    createButtons();
    createSwatches();

    bindEvents();

    refreshCursor();
    refreshDimensions();
    refreshTools();
}

function createButtons() {
    Buttons.forEach((button) => {
        const $li = document.createElement("li");
        $li.innerHTML = `<button><img src="${button.icon}" alt="${button.label}" /></button>`;
        $li.title = button.label;
        $toolsList.appendChild($li);
        $li.querySelector("button")!.addEventListener("click", () => onToolPress(button.action));
    });
}

function createSwatches() {
    ColorSwatches.forEach((color) => {
        const $li = document.createElement("li");
        $li.style.backgroundColor = color;
        $li.addEventListener("click", () => {
            selectedColor = color;
            $colorPicker.value = color;
            const $container = $("#color-bar > li:first-child") as HTMLLIElement;
            $container.style.backgroundColor = color;
        });
        $colorSwatch.appendChild($li);
    });
}

function bindEvents() {
    // Canvas
    $canvasContainer.addEventListener("mousedown", onMouseDown);
    $canvasContainer.addEventListener("mousemove", onMouseMove);
    $canvasContainer.addEventListener("mouseup", onMouseUp);
    $canvasContainer.addEventListener("mouseleave", onMouseUp);

    $canvasResizer.addEventListener("mousedown", onResizerDown);

    // Color Picker
    $colorPicker.addEventListener("change", onColorChange);

    // Cursor stroke size indicator
    $canvasContainer.addEventListener("mouseenter", (_) => {
        $cursor.style.visibility = "visible";
    });
    $canvasContainer.addEventListener("mousemove", (e) => {
        const { offsetX, offsetY } = e as MouseEvent;
        $cursor.style.top = `${offsetY}px`;
        $cursor.style.left = `${offsetX}px`;
    });
    $canvasContainer.addEventListener("mouseleave", (_) => {
        $cursor.style.visibility = "hidden";
    });
}

/* ----------------------------- Event Handlers ----------------------------- */
function onMouseDown(e: MouseEvent) {
    e.preventDefault();

    const { offsetX: x, offsetY: y } = e;

    ctx.lineWidth = strokeWidth;
    ctx.strokeStyle = selectedColor!;

    if (canvasState.mode !== CanvasMode.None) return;

    switch (selectedTool) {
        case Tools.Rectangle:
            imageData = ctx.getImageData(0, 0, $canvas.width, $canvas.height);
            ctx.globalCompositeOperation = "source-over";
            canvasState = {
                mode: CanvasMode.Inserting,
                layerType: LayerType.Rectangle,
            };

            layerState = {
                type: LayerType.Rectangle,
                x,
                y,
                width: 0,
                height: 0,
            };
            break;
        case Tools.Erase:
            ctx.globalCompositeOperation = "destination-out";
            canvasState = {
                mode: CanvasMode.Erasing,
                lastPoint: { x, y },
            };
            break;
        case Tools.Draw:
            ctx.globalCompositeOperation = "source-over";
            canvasState = {
                mode: CanvasMode.Pencil,
                lastPoint: { x, y },
            };
            break;
    }

    refreshTools();
}

function onMouseMove(e: MouseEvent) {
    e.preventDefault();
    if (!$canvas || !ctx) return;

    const { offsetX: x, offsetY: y } = e;

    switch (canvasState.mode) {
        case CanvasMode.Pencil:
        case CanvasMode.Erasing:
            // Draw
            ctx.beginPath();

            ctx.moveTo(canvasState.lastPoint.x, canvasState.lastPoint.y);

            ctx.lineTo(x, y);

            ctx.stroke();

            canvasState = {
                mode: CanvasMode.Pencil,
                lastPoint: { x, y },
            };
            break;
        case CanvasMode.Inserting:
            if (!layerState) return;

            ctx.putImageData(imageData, 0, 0);

            switch (canvasState.layerType) {
                case LayerType.Rectangle:
                    const { x: startX, y: startY } = layerState;
                    const { x: endX, y: endY } = { x, y };

                    const width = endX - startX;
                    const height = endY - startY;

                    layerState = {
                        ...layerState,
                        width,
                        height,
                    };

                    ctx.beginPath();
                    ctx.strokeStyle = selectedColor!;
                    ctx.rect(startX, startY, width, height);
                    ctx.stroke();
                    break;
            }
            break;
        case CanvasMode.Resizing:
            if (!imageData) return;

            $canvas.width = x;
            $canvas.height = y;

            ctx.putImageData(imageData, 0, 0);
            refreshDimensions();
    }
}

function onMouseUp(e: MouseEvent) {
    e.preventDefault();

    switch (canvasState.mode) {
        case CanvasMode.Pencil:
            canvasState = {
                mode: CanvasMode.None,
            };
            break;
        case CanvasMode.Inserting:
            canvasState = {
                mode: CanvasMode.None,
            };
            break;
        case CanvasMode.Resizing:
            canvasState = {
                mode: CanvasMode.None,
            };
            $canvasResizer.style.pointerEvents = "auto";
            break;
    }

    refreshTools();
}

function onColorChange(e: Event) {
    const { value } = e.target as HTMLInputElement;
    selectedColor = value;
    ctx.strokeStyle = value;

    const $container = $("#color-bar > li:first-child") as HTMLLIElement;
    $container.style.backgroundColor = value;
}

async function onToolPress(tool: Tools) {
    switch (tool) {
        case Tools.Draw:
            strokeWidth = 2;
            break;
        case Tools.Erase:
            strokeWidth = 10;
            break;
        // case Tools.Ellipse:
        //     break;
        case Tools.Rectangle:
            strokeWidth = 2;
            break;
        // case Tools.Fill:
        //     break;
        case Tools.Picker:
            const previousTool = selectedTool;
            selectedTool = tool;
            refreshTools();
            const dropper = new (window as any).EyeDropper();

            try {
                const result = await dropper.open();
                const { sRGBHex } = result;

                selectedColor = sRGBHex;
                $colorPicker.value = sRGBHex;
                const $container = $("#color-bar > li:first-child") as HTMLLIElement;
                $container.style.backgroundColor = selectedColor;

                tool = previousTool;
            } catch (e) {
                // :)
            }
            break;
        // case Tools.Save:
        //     break;
        case Tools.Trash:
            // Clear the canvas
            ctx.clearRect(0, 0, $canvas.width, $canvas.height);

            // Default back to no canvas mode
            canvasState = {
                mode: CanvasMode.None,
            };
            break;
        default:
            break;
    }
    selectedTool = tool;

    refreshCursor();

    refreshTools();
}

function onResizerDown(e: MouseEvent) {
    e.preventDefault();

    const { clientX: x, clientY: y } = e;

    imageData = ctx.getImageData(0, 0, $canvas.width, $canvas.height);

    canvasState = {
        mode: CanvasMode.Resizing,
        lastPoint: { x, y },
    };

    $canvasResizer.style.pointerEvents = "none";
}

function refreshTools() {
    // Clear active class
    const $activeButton = $toolsList.querySelector("li.active");
    if ($activeButton) {
        $activeButton.classList.remove("active");
    }

    if (!selectedTool) selectedTool = Tools.Draw;

    const $button = $toolsList.querySelector(`li:nth-child(${selectedTool + 1})`);
    $button!.classList.add("active");

    $toolIndicator.textContent = Buttons[selectedTool].label;
}

function refreshCursor() {
    $cursor.style.height = `${Math.max(4, strokeWidth)}px`;
    $cursor.style.width = `${Math.max(4, strokeWidth)}px`;

    $sizeIndicator.querySelector("span")!.textContent = `${strokeWidth}px`;
}

function refreshDimensions() {
    $dimensionsIndicator.querySelectorAll("span")[0].textContent = `${$canvas.width}px`;
    $dimensionsIndicator.querySelectorAll("span")[1].textContent = `${$canvas.height}px`;
}
/* -------------------------------- Internal -------------------------------- */

start();
