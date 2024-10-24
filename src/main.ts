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
        label: "Draw",
        icon: "/icons/draw.png",
        action: Tools.Draw,
    },
    {
        label: "Erase",
        icon: "/icons/erase.png",
        action: Tools.Erase,
    },
    {
        label: "Ellipse",
        icon: "/icons/ellipse.png",
        action: Tools.Ellipse,
    },
    {
        label: "Rectangle",
        icon: "/icons/rectangle.png",
        action: Tools.Rectangle,
    },
    {
        label: "Fill",
        icon: "/icons/fill.png",
        action: Tools.Fill,
    },
    {
        label: "Picker",
        icon: "/icons/picker.png",
        action: Tools.Picker,
    },
    {
        label: "Trash",
        icon: "/icons/trash.png",
        action: Tools.Trash,
    },
    {
        label: "Save",
        icon: "/icons/save.png",
        action: Tools.Save,
    },
];

// Elements
const $canvas = $("#canvas") as HTMLCanvasElement;
const $colorPicker = $("#color-picker") as HTMLInputElement;
const $toolsList = $("aside ul") as HTMLUListElement;

const ctx = $canvas.getContext("2d") as CanvasRenderingContext2D;

// State
let selectedTool: Tools;
let canvasState: CanvasState;
let selectedColor;
let layerState: LayerState;
let imageData: ImageData;

// Functions
function start() {
    canvasState = {
        mode: CanvasMode.None,
    };

    selectedColor = "#000000";

    createButtons();

    bindEvents();

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

function bindEvents() {
    // Canvas
    $canvas.addEventListener("mousedown", onMouseDown);
    $canvas.addEventListener("mousemove", onMouseMove);
    $canvas.addEventListener("mouseup", onMouseUp);
    $canvas.addEventListener("mouseleave", onMouseUp);

    // Color Picker
    $colorPicker.addEventListener("change", onColorChange);
}

/* ----------------------------- Event Handlers ----------------------------- */
function onMouseDown(e: MouseEvent) {
    e.preventDefault();

    const { offsetX: x, offsetY: y } = e;

    switch (selectedTool) {
        case Tools.Rectangle:
            imageData = ctx.getImageData(0, 0, $canvas.width, $canvas.height);

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
            ctx.lineWidth = 10;
            canvasState = {
                mode: CanvasMode.Erasing,
                lastPoint: { x, y },
            };
            break;
        case Tools.Draw:
            ctx.globalCompositeOperation = "source-over";
            ctx.lineWidth = 2;
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
            ctx.strokeStyle = selectedColor!;

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
    }

    refreshTools();
}

function onColorChange(e: Event) {
    const { value } = e.target as HTMLInputElement;
    selectedColor = value;
}

function onToolPress(tool: Tools) {
    switch (tool) {
        // case Tools.Draw:
        //     break;
        // case Tools.Erase:
        //     break;
        // case Tools.Ellipse:
        //     break;
        // case Tools.Rectangle:
        //     canvasState = {
        //         mode: CanvasMode.Inserting,
        //         layerType: LayerType.Rectangle,
        //     };
        //     break;
        // case Tools.Fill:
        //     break;
        // case Tools.Picker:
        //     break;
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
            selectedTool = tool;
            break;
    }

    refreshTools();
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
}
/* -------------------------------- Internal -------------------------------- */

start();
