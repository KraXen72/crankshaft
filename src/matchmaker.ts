import { secondsToTimestring } from "./utils";
// matchmaker code originally by wa#3991 / paintingofblue

// my script to get all the id => string gamemode bindings as a switch:
// https://greasyfork.org/en/scripts/468482-kraxen-s-krunker-utils
function getGameMode(num: number) {
	switch (num) {
		case 0:
			return 'Free for All';
		case 1:
			return 'Team Deathmatch';
		case 2:
			return 'Hardpoint';
		case 3:
			return 'Capture the Flag';
		case 4:
			return 'Parkour';
		case 5:
			return 'Hide & Seek';
		case 6:
			return 'Infected';
		case 7:
			return 'Race';
		case 8:
			return 'Last Man Standing';
		case 9:
			return 'Simon Says';
		case 10:
			return 'Gun Game';
		case 11:
			return 'Prop Hunt';
		case 12:
			return 'Boss Hunt';
		case 13:
			return 'Classic FFA';
		case 14:
			return 'Deposit';
		case 15:
			return 'Stalker';
		case 16:
			return 'King of the Hill';
		case 17:
			return 'One in the Chamber';
		case 18:
			return 'Trade';
		case 19:
			return 'Kill Confirmed';
		case 20:
			return 'Defuse';
		case 21:
			return 'Sharp Shooter';
		case 22:
			return 'Traitor';
		case 23:
			return 'Raid';
		case 24:
			return 'Blitz';
		case 25:
			return 'Domination';
		case 26:
			return 'Squad Deathmatch';
		case 27:
			return 'Kranked FFA';
		case 28:
			return 'Team Defender';
		case 29:
			return 'Deposit FFA';
		case 30:
			return 'Chaos Snipers';
		case 31:
			return 'Bighead FFA';
		default:
			return 'unknown';
	}
}

const matchmakerCriteria: IMatchmakerCriteria = {
	regions: ['FRA'],
	gameModes: ['Free for All'],
	minPlayers: 4,
	maxPlayers: 6,
	minRemainingTime: 180,
};

export function fetchGame() {
	fetch(`https://matchmaker.krunker.io/game-list?hostname=${window.location.hostname}`)
		.then((result) => result.json())
		.then((result) => {
			const games = [];

			for (const game of result.games) {
				const gameID = game[0];
				const region = gameID.split(':')[0];
				const playerCount = game[2];
				const maxPlayers = game[3];
				const map = game[4]['i'];
				const gamemode = getGameMode(game[4]['g']);
				const remainingTime = game[5];

				if (
					!matchmakerCriteria.regions.includes(region) ||
					!matchmakerCriteria.gameModes.includes(gamemode) ||
					playerCount < matchmakerCriteria.minPlayers ||
					playerCount > matchmakerCriteria.maxPlayers ||
					remainingTime < matchmakerCriteria.minRemainingTime ||
					playerCount === maxPlayers ||
					window.location.href.includes(gameID)
				)
					continue;

				games.push({
					gameID: gameID,
					region: region,
					playerCount: playerCount,
					maxPlayers: maxPlayers,
					map: map,
					gamemode: gamemode,
					remainingTime: remainingTime,
				});
			}

			const game = games[Math.floor(Math.random() * games.length)];
			try {
				const text = `Game found!\n\nRegion: ${game.region}\nMap: ${game.map}\nGamemode: ${game.gamemode}\nPlayers: ${game.playerCount}/${game.maxPlayers}\nTime remaining: ${secondsToTimestring(game.remainingTime)}\n\nJoining game...`;
				alert(text);
				window.location.href = `https://krunker.io/?game=${game.gameID}`;
			} catch (e) {
				alert('Unable to find game.');
			}
		});
}

// TODO reimplement with menu
// TODO add a setting that overrides the f6 key in favor of normal F6
// TODO add gui config to this matchmaker
// TODO change alert() to showMessageBoxSync()
// TODO add maxPlayers setting (for example if somebody wants max 6 players to be safe & make sure to join)

