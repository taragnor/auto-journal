import {Parser, Trie} from "./parser.js";
import {getGame} from "./getGame.js";

export class LinkManager {

	static TRIE :Trie;
	static ALIAS_TABLE : {[key:string]: string};

	static async updateLinks(changedEntryId: string) {
		const journalEntry = LinkManager.getJournalEntry(changedEntryId)!;
		const content = LinkManager.getJournalContent(journalEntry);
		try {
			const embeddedOutgoingLinks = LinkManager.getEmbeddedOutgoingLinks(content);
			const nonembeddedOutgoingLinks = LinkManager.getNonEmbeddedOutgoingLinks(content);
			const outgoingLinks = embeddedOutgoingLinks.concat(nonembeddedOutgoingLinks);
			await LinkManager.updateOutgoingFlags(journalEntry, outgoingLinks);
		} catch (e) {
			console.error(content);
			throw e;
		}
	}

	static async updateOutgoingFlags(journalEntry: StoredDocument<JournalEntry>, outgoingLinks: JournalEntry[]) {
		const flagArray= (journalEntry.getFlag("auto-journal", "outgoing") ?? []) as string[];
		const outgoingIds = outgoingLinks.map( x=> x.id ?? "")
			.filter( (val, index, arr) => arr.indexOf(val) === index);
		console.log(`Outgoing Flags ${outgoingIds}`);
		const newEntries = outgoingIds.filter( x=> !flagArray.includes(x));
		const removedEntries = flagArray.filter( x=> !outgoingIds.includes(x));
		for (const id of newEntries)
			await LinkManager.updateIncomingFlags(id, journalEntry.id, true);
		for (const id of removedEntries)
			await LinkManager.updateIncomingFlags(id, journalEntry.id, true);
		if (newEntries.length || removedEntries.length) {
			await journalEntry.setFlag("auto-journal", "outgoing", outgoingIds);
			console.log(`Updated Outgoing Flags ${outgoingIds}`);
		}
	}

	static async updateIncomingFlags(journalEntryId:string, incomingId :string, isAdd:boolean) {
		const journalEntry = LinkManager.getJournalEntry(journalEntryId);
		if (!journalEntry) {
			throw new Error(`No entry found for ID:${journalEntryId}`);
		}
		const flagArray = (journalEntry.getFlag("auto-journal", "incoming") ?? []) as string[];
		if (isAdd && !flagArray.includes(incomingId)) {
			const newArray  = flagArray.concat( [incomingId]);
			await journalEntry.setFlag("auto-journal", "incoming", newArray);
			console.log(`Updated Incoming Flags ${newArray}`);
		}
		if (!isAdd && flagArray.includes(incomingId)) {
			const newArray  = flagArray.filter( x=> x != incomingId);
			await journalEntry.setFlag("auto-journal", "incoming", newArray);
			console.log(`Updated Incoming Flags ${newArray}`);
		}
	}

	static getJournalEntry(id: string) {
		const game = getGame();
		return game.journal!.get(id);
	}

	static getJournalContent (journalEntry: StoredDocument<JournalEntry>) {
		const content = journalEntry.data.content;
		if (content === undefined) {
			console.log(journalEntry);
			console.log(journalEntry.data);
			throw new Error(`NO content for ${journalEntry.name}`);
		}
		return content;
	}

	static equivalentArrays(a: any[] | null, b: any[] | null) {
		if (a === b) return true;
		if (a == null || b == null) return false;
		if (a.length !== b.length) return false;
		for (let i = 0; i < a.length; ++i) {
			if (a[i] !== b[i]) return false;
		}
		return true;
	}

	static getEmbeddedOutgoingLinks(text : string) {
		return Parser.getEmbeddedOutgoingLinks(text);
	}

	static getNonEmbeddedOutgoingLinks(text: string) {
		const trie = LinkManager.getTrie();
		const data = Parser.getNonEmbeddedOutgoingLinks	(text, trie);
		const convertedData = data.map( nickname=> {
				const id = LinkManager.convertNickName(nickname);
				return {
					full: nickname,
					id,
					label: nickname,
					index: null
				};
			});
		return convertedData;
	}

	static getTrie() {
		return LinkManager.TRIE;
	}

	static refreshTrie() {
		// console.log("Refreshing Trie");
		const game = getGame();
		const list = game.journal!
			.map( x => x.getAllVisibleNames() )
			.flat();
		// console.log(list);
		LinkManager.TRIE = new Trie(list);
		return LinkManager.getTrie();
	}

	static convertNickName(name: string) {
		const table = LinkManager.ALIAS_TABLE;
		const value = table[name];
		if (value)
			return value;
		throw new Error(`No alias value for ${name}`);
	}

	static refreshAliasTable() {
		// console.log("Refreshing Alias Table");
		const game = getGame();
		const table = game.journal!.reduce( (acc, x) => {
			acc[x.name!] = x.id;
			return acc;
		}, {} as {[key:string]: string});
		LinkManager.ALIAS_TABLE = table;
	}

	static async onStartUp()  {
		LinkManager.refreshTrie();
		LinkManager.refreshAliasTable();
	}

	static async onJournalNameChange(journalId: string, old_name: string, new_name: string) {
		LinkManager.refreshTrie();
		LinkManager.refreshAliasTable();
	}

	static async onCreateJournal(journalid: string) {
		LinkManager.refreshTrie();
		LinkManager.refreshAliasTable();
		await LinkManager.updateLinks(journalid);
	}
}
