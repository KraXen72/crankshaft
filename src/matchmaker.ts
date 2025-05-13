import { strippedConsole } from './preload';
import { createElement, secondsToTimestring } from './utils';

// eslint-disable-next-line max-len
export const MATCHMAKER_GAMEMODES = ['Free for All', 'Team Deathmatch', 'Hardpoint', 'Capture the Flag', 'Parkour', 'Hide & Seek', 'Infected', 'Race', 'Last Man Standing', 'Simon Says', 'Gun Game', 'Prop Hunt', 'Boss Hunt', 'Classic FFA', 'Deposit', 'Stalker', 'King of the Hill', 'One in the Chamber', 'Trade', 'Kill Confirmed', 'Defuse', 'Sharp Shooter', 'Traitor', 'Raid', 'Blitz', 'Domination', 'Squad Deathmatch', 'Kranked FFA', 'Team Defender', 'Deposit FFA', 'Chaos Snipers', 'Bighead FFA'];
export const MATCHMAKER_REGIONS = ['MBI', 'NY', 'FRA', 'SIN', 'DAL', 'SYD', 'MIA', 'BHN', 'TOK', 'BRZ', 'AFR', 'LON', 'CHI', 'SV', 'STL', 'MX'];
export const MATCHMAKER_REGION_NAMES = { "MBI": "Mumbai", "NY": "New York", "FRA": "Frankfurt", "SIN": "Singapore", "DAL": "Dallas", "SYD": "Sydney", "MIA": "Miami", "BHN": "Middle East", "TOK": "Tokyo", "BRZ": "Brazil", "AFR": "South Africa", "LON": "London", "CHI": "China", "SV": "Silicon Valley", "STL": "Seattle", "MX": "Mexico", "SSS": "Super Secret Servers" };
export const MATCHMAKER_MAP_ICON_INDICES = ['Burg', 'Littletown', 'Sandstorm', 'Subzero', 'Undergrowth', 'Shipment', 'Freight', 'Lostworld', 'Citadel', 'Oasis', 'Kanji', 'Industry', 'Lumber', 'Evacuation', 'Site', 'SkyTemple', 'Lagoon', 'Bureau', 'Tortuga', 'Tropicano', 'Krunk_Plaza', 'Arena', 'Habitat', 'Atomic', 'Old_Burg', 'Throwback', 'Stockade', 'Facility', 'Clockwork', 'Laboratory', 'Shipyard', 'Soul Sanctum', 'Bazaar', 'Erupt', 'HQ', 'Khepri'];

// https://greasyfork.org/en/scripts/468482-kraxen-s-krunker-utils

/**
 * Acts on the user's input for the matchmaker popup
 * @param accept whether or not the new game was accepted
 */
function decideMatchmakerDecision(accept: boolean) {
	// @ts-ignore Built into the global window object from krunker
	window.playSelect();
	if (accept && currentMatch !== 'none') {
		window.location.href = `https://krunker.io/?game=${currentMatch}`;
	} else {
		popupElement.remove();
		// @ts-ignore Built into the global window object from krunker
		if (currentMatch === 'none') window.openServerWindow(0);
	}
}

// ID of the container element, used to construct and to check if it's attached to the DOM.
const popupContainerID = "matchmakerPopupContainer";

// Create popup element
const popupElement = createElement('div', { id: popupContainerID });

const popupTitle = createElement('div', { id: "matchmakerPopupTitle" });
popupElement.appendChild(popupTitle);

const popupDescription = createElement('div', { id: "matchmakerPopupDescription" });
popupElement.appendChild(popupDescription);

const popupOptions = createElement('div', { id: "matchmakerPopupOptions" });

const confirmKey = "Enter";
const popupConfirmOption = createElement('div', {
	class: ["matchmakerPopupButton", "bigShadowT"],
	id: "matchmakerConfirmButton",
	text: "Join",
	onmouseenter: "playTick()" // This is to play the little krunker 'tick' noise when hovering over the button.
})
popupConfirmOption.addEventListener('click', () => { decideMatchmakerDecision(true) });

const cancelKey = "Escape";
const popupCancelOption = createElement('div', {
	class: ["matchmakerPopupButton", "bigShadowT"],
	id: "matchmakerCancelButton",
	text: "Cancel",
	onmouseenter: "playTick()" // This is to play the little krunker 'tick' noise when hovering over the button.
})
popupCancelOption.addEventListener('click', () => { decideMatchmakerDecision(false) });

popupOptions.appendChild(popupConfirmOption);
popupOptions.appendChild(popupCancelOption);
popupElement.appendChild(popupOptions);

/**
 * Handles keyboard input for the matchmaker
 * @param event The keyboard event that initiated the handler
 */
function handleMatchmakerBind(event: KeyboardEvent) {
	if (event.code === confirmKey || event.code === cancelKey) {
		document.removeEventListener('keydown', handleMatchmakerBind, true);
		if (event.code === confirmKey) {
			decideMatchmakerDecision(true);
		} else if (event.code === cancelKey) {
			decideMatchmakerDecision(false);
		}
	}
}

/**
 * Sets the matchmaker element styles & content, shows the popup
 * @param game The game that was retrieved by the custom matchmaker
 */
function createFetchedGamePopup(game: IMatchmakerGame) {
	popupElement.style["backgroundImage"] = `url(https://assets.krunker.io/img/maps/map_${ MATCHMAKER_MAP_ICON_INDICES.indexOf(game.map) || 0}.png)`;
	
	currentMatch = game.gameID;
	if (game.gameID === "none") {
		popupTitle.innerText = "No Games Found...";
		popupDescription.innerHTML = "Check the server browser to see other lobbies.";
		popupConfirmOption.style.display = "none";
	} else {
		popupTitle.innerText = "Game Found!";
		popupDescription.innerHTML = `${game.gamemode} on ${game.map} (${MATCHMAKER_REGION_NAMES[game.region as keyof typeof MATCHMAKER_REGION_NAMES] ?? "Unknown Region"})<br/>${game.playerCount}/${game.playerLimit} Players, ${ secondsToTimestring(game.remainingTime) } Left`;
		popupConfirmOption.style.display = "block";
	}

	document.addEventListener('keydown', handleMatchmakerBind, true);
	document.getElementById("uiBase").appendChild(popupElement);
}

/**
 * The last found match ID, used to filter matchmaker results and to handle acceptance or rejection of the new lobby
 * - When set to "none", popup interactions act like no lobby was found.
 */
let currentMatch = '';

/**
 * Retrieves a lobby using the custom matchmaker, presents the user with a popup
 * @param _userPrefs User Preferences Object
 */
export async function fetchGame(_userPrefs: UserPrefs) {
	// If the popup is active, hide it gracefully and create a new one.
	if (document.getElementById(popupContainerID)) decideMatchmakerDecision(false);
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
		const gamemode = MATCHMAKER_GAMEMODES[game[4].g] ?? "Unknown Gamemode";
		const remainingTime = game[5];

		if (
			!criteria.regions.includes(region)
			|| !criteria.gameModes.includes(gamemode)
			|| playerCount < criteria.minPlayers
			|| playerCount > criteria.maxPlayers
			|| remainingTime < criteria.minRemainingTime
			|| playerCount === playerLimit
			|| window.location.href.includes(gameID)
			|| currentMatch === gameID
		) continue;

		games.push({ gameID, region, playerCount, playerLimit, map, gamemode, remainingTime });
	}

	if (games.length > 0) {
		const game = games[Math.floor(Math.random() * games.length)];
		createFetchedGamePopup(game);
	} else {
		createFetchedGamePopup({
			gameID: "none",
			region: "none",
			playerCount: 0,
			playerLimit: 0,
			map: MATCHMAKER_MAP_ICON_INDICES[0],
			gamemode: MATCHMAKER_GAMEMODES[0],
			remainingTime: 0
		});
	}
}

