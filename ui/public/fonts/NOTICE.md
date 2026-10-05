# Bundled UI Fonts

Paperclip bundles Inter for the board UI so screenshots and packaged installs use
the same sans-serif text stack without relying on host font packages.

## Inter

- Upstream project: https://github.com/rsms/inter
- Version: v4.1
- Source files:
  - https://raw.githubusercontent.com/rsms/inter/v4.1/docs/font-files/InterVariable.woff2
  - https://raw.githubusercontent.com/rsms/inter/v4.1/docs/font-files/InterVariable-Italic.woff2
- License: SIL Open Font License 1.1
- License text: https://github.com/rsms/inter/blob/v4.1/LICENSE.txt

Redistribution note: Inter is redistributed under the SIL Open Font License 1.1.
The bundled WOFF2 files are included unmodified from the upstream v4.1 release.

## Vazirmatn

Vazirmatn supplies the Persian/Arabic glyphs. Its `@font-face` is limited by
`unicode-range` to Arabic-script code points, so Latin text keeps using Inter.

- Upstream project: https://github.com/rastikerdar/vazirmatn
- Version: v33.0.3 (npm package `vazirmatn@33.0.3`)
- Source file: `misc/Non-Latin/fonts/webfonts/Vazirmatn-NL[wght].woff2`,
  bundled as `VazirmatnNL-Variable.woff2` (Non-Latin variable build)
- License: SIL Open Font License 1.1
- License text: https://github.com/rastikerdar/vazirmatn/blob/v33.0.3/OFL.txt

Redistribution note: Vazirmatn is redistributed under the SIL Open Font License 1.1.
The bundled WOFF2 file is included unmodified from the upstream v33.0.3 release;
only the file name differs.
