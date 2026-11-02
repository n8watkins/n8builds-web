import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

/** A fontconfig that adds the Windows fonts Scribe asks for (Segoe UI Variable, Cascadia), when WSL can see them. */
export function windowsFonts() {
  const winFonts = '/mnt/c/Windows/Fonts'
  if (!fs.existsSync(winFonts)) return {}
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'scribe-tour-fonts-'))
  const names = ['SegUIVar.ttf', 'segoeui.ttf', 'segoeuib.ttf', 'seguisb.ttf', 'CascadiaCode.ttf', 'CascadiaMono.ttf', 'consola.ttf']
  fs.mkdirSync(path.join(dir, 'fonts'))
  for (const name of names) if (fs.existsSync(path.join(winFonts, name))) fs.copyFileSync(path.join(winFonts, name), path.join(dir, 'fonts', name))
  const conf = path.join(dir, 'fonts.conf')
  fs.writeFileSync(
    conf,
    `<?xml version="1.0"?><!DOCTYPE fontconfig SYSTEM "fonts.dtd"><fontconfig><include ignore_missing="yes">/etc/fonts/fonts.conf</include><dir>${dir}/fonts</dir><cachedir>${dir}/cache</cachedir></fontconfig>`,
  )
  return { FONTCONFIG_FILE: conf }
}
