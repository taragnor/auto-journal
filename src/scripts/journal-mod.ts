import {getGame} from "./getGame.js";


declare global {
	interface JournalEntry {
		getAllVisibleNames(): string[];
		addNickname(name:string, playerVisible:boolean) : void;
		removeNickname(name:string): void;
	}

	interface NickName {
		name: string;
		playerVisible: boolean;
		caseRules: string;
	}

}

if (!JournalEntry.prototype.getAllVisibleNames) {
	JournalEntry.prototype.getAllVisibleNames = function(this:JournalEntry) {
		const game = getGame();
		const names : NickName[] = (this.getFlag("auto-journal", "nicknames") ?? []) as NickName[];
		const isGM = game.user!.isGM;
		const visibleNames = names.filter( x=> isGM || x.playerVisible)
			.map( x=> x.name);
		return visibleNames.concat([this.name]);
	}
}

JournalEntry.prototype.addNickname = async function (this:JournalEntry, name:string, playerVisible= false) {
	const names: NickName[]= (this.getFlag("auto-journal", "nicknames") ?? []) as NickName[];
	if (!names.some(x=> x.name == name)) {
		const obj = {
			name,
			playerVisible,
			caseRules: "default"
		}
		names.concat([obj]);
		await this.setFlag("auto-journal", "nicknames", names);
	}
}

JournalEntry.prototype.removeNickname = async function (this: JournalEntry, name:string) {
	const names= (this.getFlag("auto-journal", "nicknames") ?? []) as NickName[];
	if (names.some(x => x.name == name)) {
		const newNames = names.filter( x=> x.name != name);
		await this.setFlag("auto-journal", "nicknames", newNames);
	}
}


