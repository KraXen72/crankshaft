import { secondsToTimestring } from './utils';

/*
 * import { strippedConsole } from "./preload";
 * matchmaker code originally by wa#3991 / paintingofblue
 */


// https://greasyfork.org/en/scripts/468482-kraxen-s-krunker-utils
export const MATCHMAKER_REGIONS = ['MBI', 'NY', 'FRA', 'SIN', 'DAL', 'SYD', 'MIA', 'BHN', 'TOK', 'BRZ', 'AFR', 'LON', 'CHI', 'SV', 'STL', 'MX'];
// eslint-disable-next-line max-len
export const MATCHMAKER_GAMEMODES = ['Free for All', 'Team Deathmatch', 'Hardpoint', 'Capture the Flag', 'Parkour', 'Hide & Seek', 'Infected', 'Race', 'Last Man Standing', 'Simon Says', 'Gun Game', 'Prop Hunt', 'Boss Hunt', 'Classic FFA', 'Deposit', 'Stalker', 'King of the Hill', 'One in the Chamber', 'Trade', 'Kill Confirmed', 'Defuse', 'Sharp Shooter', 'Traitor', 'Raid', 'Blitz', 'Domination', 'Squad Deathmatch', 'Kranked FFA', 'Team Defender', 'Deposit FFA', 'Chaos Snipers', 'Bighead FFA'];

function getGameMode(num: number) {
	return MATCHMAKER_GAMEMODES[num];
}

const matchmakerCriteria: IMatchmakerCriteria = {
	regions: ['FRA'],
	gameModes: ['Free for All'],
	minPlayers: 4,
	maxPlayers: 6,
	minRemainingTime: 180
};

export function fetchGame() {
	fetch(`https://matchmaker.krunker.io/game-list?hostname=${window.location.hostname}`)
		.then(result => result.json())
		.then(result => {
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
					!matchmakerCriteria.regions.includes(region)
					|| !matchmakerCriteria.gameModes.includes(gamemode)
					|| playerCount < matchmakerCriteria.minPlayers
					|| playerCount > matchmakerCriteria.maxPlayers
					|| remainingTime < matchmakerCriteria.minRemainingTime
					|| playerCount === playerLimit
					|| window.location.href.includes(gameID)
				) continue;

				games.push({
					gameID,
					region,
					playerCount,
					playerLimit,
					map,
					gamemode,
					remainingTime
				});
			}

			const game = games[Math.floor(Math.random() * games.length)];
			try {
				// eslint-disable-next-line max-len
				const text = `Game found!\n\nRegion: ${game.region}\nMap: ${game.map}\nGamemode: ${game.gamemode}\nPlayers: ${game.playerCount}/${game.playerLimit}\nTime remaining: ${secondsToTimestring(game.remainingTime)}\n\nJoining game...`;
				// eslint-disable-next-line no-alert
				if (confirm(text)) window.location.href = `https://krunker.io/?game=${game.gameID}`;
			} catch (e) {
				// eslint-disable-next-line no-alert
				alert('Unable to find an active game matching your criteria. Please adjust matchmaker criteria or try again later.');
			}
		});
}

/*
 * TODO mention matchmaker in readme
 * TODO if main matchmaker setting is off, don't run any of this code
 * TODO reimplement hotkey with menu
 * TODO implement the setting that overrides the f6 key in favor of normal F6
 */

// TODO possibly add map selection? although there are so many maps...

