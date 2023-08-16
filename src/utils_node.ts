import { mkdirSync, readdirSync, lstatSync, copyFileSync, existsSync, unlinkSync, rmdirSync } from 'fs';
import { join as pathJoin } from 'path';

/// <reference path="global.d.ts" />

// who thought trying to move a directory on node 12 would be so hard? i've tried fs-extra, move-concurrently and mv. none work.

/**
 * recursive synchronous folder copy (modified from SO)
 * @link https://stackoverflow.com/a/52338335/13342359 
 */
export function copyFolderSync(from: string, to: string) {
	if (!existsSync(to)) mkdirSync(to);
	readdirSync(from).forEach(element => {
		const fromElementAbs = pathJoin(from, element);
		const toElementAbs = pathJoin(to, element);

		if (lstatSync(fromElementAbs).isDirectory()) copyFolderSync(fromElementAbs, toElementAbs);
		else copyFileSync(fromElementAbs, toElementAbs);
	});
}

/**
 * recursive synchronous folder remove (modified from SO)
 * @link https://stackoverflow.com/a/42505874/3027390
 */
export function removeFolderSync(folderPath: string) {
	if (!existsSync(folderPath)) return;
	readdirSync(folderPath).forEach(element => {
		const elementAbs = pathJoin(folderPath, element);

		if (lstatSync(elementAbs).isDirectory()) removeFolderSync(elementAbs);
		else unlinkSync(elementAbs);
	});
	rmdirSync(folderPath);
}

/** move a directory synchronously, even across drives. (copy + delete) */
export function moveFolderSync(from: string, to: string) {
	copyFolderSync(from, to);
	removeFolderSync(from);
}
