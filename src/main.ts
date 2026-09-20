import { GameManager } from "./core/GameManager";

const canvas = document.querySelector<HTMLCanvasElement>("#game-canvas");
const ui = document.querySelector<HTMLElement>("#ui-root");
if (!canvas || !ui) throw new Error("OKAP CITY pa ka demare: canvas oswa UI manke.");

const game = new GameManager(canvas, ui);
void game.start();

Object.defineProperty(window, "OKAP_CITY", { value: game });
