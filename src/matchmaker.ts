import { strippedConsole } from './preload';
import { secondsToTimestring } from './utils';

// eslint-disable-next-line max-len
export const MATCHMAKER_GAMEMODES = ['Free for All', 'Team Deathmatch', 'Hardpoint', 'Capture the Flag', 'Parkour', 'Hide & Seek', 'Infected', 'Race', 'Last Man Standing', 'Simon Says', 'Gun Game', 'Prop Hunt', 'Boss Hunt', 'Classic FFA', 'Deposit', 'Stalker', 'King of the Hill', 'One in the Chamber', 'Trade', 'Kill Confirmed', 'Defuse', 'Sharp Shooter', 'Traitor', 'Raid', 'Blitz', 'Domination', 'Squad Deathmatch', 'Kranked FFA', 'Team Defender', 'Deposit FFA', 'Chaos Snipers', 'Bighead FFA'];
export const MATCHMAKER_REGIONS = ['MBI', 'NY', 'FRA', 'SIN', 'DAL', 'SYD', 'MIA', 'BHN', 'TOK', 'BRZ', 'AFR', 'LON', 'CHI', 'SV', 'STL', 'MX'];

// https://greasyfork.org/en/scripts/468482-kraxen-s-krunker-utils

/// <reference path="global.d.ts" />

function getGameMode(num: number) {
	return MATCHMAKER_GAMEMODES[num];
}

function matchmakerMessageText(game: IMatchmakerGame, meeting: number, all: number) {
	return `Game found! ${game.gameID} (${meeting}/${all} games meet criteria)
	
	Region: ${game.region}
	Map: ${game.map}
	Gamemode: ${game.gamemode}
	Players: ${game.playerCount}/${game.playerLimit}
	Time remaining: ${secondsToTimestring(game.remainingTime)}
	
	Join game?`;
}

export async function fetchGame(_userPrefs: UserPrefs) {
	const criteria = {
		regions: _userPrefs.matchmaker_regions,
		gameModes: _userPrefs.matchmaker_gamemodes,
		minPlayers: _userPrefs.matchmaker_minPlayers,
		maxPlayers: _userPrefs.matchmaker_maxPlayers,
		minRemainingTime: _userPrefs.matchmaker_minRemainingTime
	} as IMatchmakerCriteria;

	const response = await fetch(`https://matchmaker.krunker.io/game-list?hostname=${window.location.hostname}`);
	const result = await response.json();
	const games = [];

	for (const game of result.games) {
		const gameID = game[0];
		const region = gameID.split(':')[0];
		const playerCount = game[2];
		const playerLimit = game[3];
		const map = game[4].i;
		const gamemode = getGameMode(game[4].g);
		const remainingTime = game[5];

		if (
			!criteria.regions.includes(region)
			|| !criteria.gameModes.includes(gamemode)
			|| playerCount < criteria.minPlayers
			|| playerCount > criteria.maxPlayers
			|| remainingTime < criteria.minRemainingTime
			|| playerCount === playerLimit
			|| window.location.href.includes(gameID)
		) continue;

		games.push({ gameID, region, playerCount, playerLimit, map, gamemode, remainingTime });
	}

	if (games.length > 0) {
		const game = games[Math.floor(Math.random() * games.length)];
		// eslint-disable-next-line
		if (confirm(matchmakerMessageText(game, games.length, result.games.length))) window.location.href = `https://krunker.io/?game=${game.gameID}`;
	} else {
		// eslint-disable-next-line no-alert
		alert("Couldn't find any games matching your criteria. Please change them or try again later.");
		strippedConsole.log(criteria);
	}
}

