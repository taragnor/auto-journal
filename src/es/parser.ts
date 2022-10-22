interface JournalIndex {
	full: string;
	id: string;
	label: string;
	index: number;
}

export class Parser {

	static JournalRegex = new RegExp(/@JournalEntry\[([a-zA-Z0-9]+)\]{([^}]*)}/gm);

	static getEmbeddedOutgoingLinks(journalText: string) : JournalIndex[] {
		// const journalregex= /@JournalEntry\[([a-zA-Z0-9]+)\]{([^}]*)}/gm;
		// const re = new RegExp(journalregex);
		const re = Parser.JournalRegex;
		const output = journalText.matchAll(re);
		const array : JournalIndex[] = [];
		for (const item of output) {
			// console.log(item);
			if (item.index != null)
				array.push({
					full: item[0],
					id: item[1],
					label: item[2],
					index: item.index
				});
		}
		// console.log(array);
		return array;
	}

	static getNonEmbeddedOutgoingLinks(journalText: string, trie = new Trie()) : JournalIndex[] {
		let links = [];
		const stripped = Parser.stripHTML(journalText);
		const embeddedGone = Parser.eliminateEmbedded(stripped);
		let buffer = "", possible = "";
		for (const word of Parser.tokenize(embeddedGone)) {
			// console.log(`Word: ${word}`);
			buffer += word;
			const match = trie.includesPartial(buffer);
			if (!match) {
				if (possible)
					links.push(possible);
				buffer ="";
				possible = "";
				continue;
			} else if (match?.endpoint) {
				if (match?.branches > 0)
					possible = buffer;
				else {
					links.push(buffer);
					buffer ="";
					possible = "";
				}
			}
		}
		return links;
	}

	static *tokenize(text: string) {
		const re = new RegExp( /([^ '"`,.;:!?\[\]@\n]+)([ '"`,.;:!?\[\]@\n]*)/gm);
		for (const match of text.matchAll(re)) {
			yield match[1];
			yield match[2];
		}
	}

	static getOutgoingLinks(journalText:string , trie:Trie) {
		return Parser.getEmbeddedOutgoingLinks(journalText)
			.concat(Parser.getNonEmbeddedOutgoingLinks(journalText, trie));
	}

	static eliminateEmbedded(journalText: string) {
		const re = Parser.JournalRegex;
		return journalText.replaceAll(re, "");
	}

	static stripHTML( text : string) {
		let ret = "";
		let intag = 0;
		for (const c of text) {
			if (c == "<") intag++;
			if (!intag)
				ret += c
			if (c == ">") intag--;
			if (intag < 0)
				throw new Error("stripHTML error");
		}
		return ret;
	}
}

export class Trie {
	endpoint: boolean;
	branches: number;
	data: Map<string, Trie>;

	constructor (array : string[] = []) {
		this.endpoint = false;
		this.branches = 0;
		for (const x of array) {
			this.insert(x);
		}
	}

	insert(word :string) {
		if (!word.length) {
			this.endpoint = true;
			return;
		}
		const head = word[0];
		const rest = word.substring(1);
		const subtrie = this.data.get(head);
		if (subtrie == undefined) {
			this.data.set(head, new Trie());
			this.branches ++;
		} else {
			subtrie.insert(rest);
		}
	}

	includes(word: string) : boolean | null {
		if (!word.length)
			return this.endpoint;
		const head = word[0];
		const rest = word.substring(1);
		const next = this.data.get(head);
		if (next) {
			return next.includes(rest);
		}
		else return null;
	}

	includesPartial(word: string) : Trie | null{
		if (!word.length)
			return this;
		const head = word[0];
		const rest = word.substring(1);
		const next = this.data.get(head);
		if (next) {
			return next.includesPartial(rest);
		}
		else return null;
	}
}
