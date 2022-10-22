export function getGame() : Game  {
	if ("world" in game && game.world) return game;
	else
		throw new Error("No game");
}

