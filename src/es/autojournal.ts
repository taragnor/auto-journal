import {Test} from "./testing.js";
import {LinkManager} from "./link-manager.js";
import "./journal-mod.js";

function tests () {
	console.log("***** Init Test ****");
	// Test.run();
	setTimeout( Test.run, 1000);
}

async function main() {
	await LinkManager.onStartUp();
	tests();
}

async function onJournalPreUpdate (journalEntry: JournalEntry, diff: {[key:string]: any}) {
	if (diff?.name) {
		await LinkManager.onJournalNameChange(journalEntry.id, journalEntry.name, diff.name);
		console.log(`Preupdate ${journalEntry.name}`);
		// console.log(arguments);
		return true;
	}
}


async function onJournalUpdate (journalEntry: JournalEntry, diff: {[key:string]:any}) {
	if (diff?.content) {
		// console.log("Updating Entry");
		await LinkManager.updateLinks(journalEntry.id);
	}
}

async function onJournalCreate (journalEntry: JournalEntry) {
	// console.log("Creating Entry");
	await LinkManager.onCreateJournal(journalEntry.id);
}


Hooks.on("ready", main);
Hooks.on("updateJournalEntry", onJournalUpdate);
Hooks.on("createJournalEntry", onJournalCreate);
Hooks.on("preUpdateJournalEntry", onJournalPreUpdate);

