export interface LiveObjective {
  id: string;
  title: string;
  done: boolean;
}

export class MatchObjectives {
  items: LiveObjective[] = [];

  reset() {
    this.items = [
      { id: "kay", title: "Antre nan kay la", done: false },
      { id: "valiz", title: "Ranmase valiz la", done: false },
      { id: "drive", title: "Kondwi yon machin", done: false },
      { id: "port", title: "Ale nan Port Okap", done: false },
    ];
  }

  complete(id: string) {
    const item = this.items.find((x) => x.id === id);
    if (!item || item.done) return false;
    item.done = true;
    return true;
  }

  doneCount() {
    return this.items.filter((x) => x.done).length;
  }
}
