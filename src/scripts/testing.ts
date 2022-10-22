import {Parser, Trie} from "./parser.js";
import {LinkManager} from "./link-manager.js";

export class Test {

	static async run() {
		// await Test.parserTest();
		window.LinkManager = LinkManager;
		await Test.trieTest();
		// await Test.stripHTMLTest();
		// await Test.updateTest();
	}

	static async parserTest () {
		console.log("AutoJournal Tool");
		console.log("Test Suite Online");
		// Parser.getLinks("@JournalEntry[eEyAxxFnbUckujPe]{TestX}");
		const text = game.journal.getName("x").data.content;
		console.log(Parser.getOutgoingLinks(text));
		// Parser.getLinks("@JournalEntry[eEyAxxFnbUckujPe]{TestX}\n  fdasfdasfadsfasdfjasrewaufldksajfsda @JournalEntry[fdasfdsafkajaewruk]{YX}");
	}

	static async updateTest() {
		for (const entry of game.journal.map(x=> x))
			await LinkManager.updateLinks(entry.id);
	}

	static async stripHTMLTest() {
		const text = game.journal.getName("x").data.content;
		console.log(Parser.stripHTML(text));
	}

	static async trieTest() {
		const trie = LinkManager.getTrie();
		const text = game.journal.getName("x").data.content;
		const links = Parser.getNonEmbeddedOutgoingLinks(text, trie);
		console.assert (links.length, links);
		console.log(links);
	}

}
