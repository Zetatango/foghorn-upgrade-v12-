[![CircleCI](https://circleci.com/gh/Zetatango/foghorn.svg?style=svg&circle-token=96488ef4d9114e48761c1ec17c389dda3e91d17d)](https://circleci.com/gh/Zetatango/foghorn) [![codecov](https://codecov.io/gh/Zetatango/foghorn/branch/master/graph/badge.svg?token=aeQLgEIliv)](https://codecov.io/gh/Zetatango/foghorn) Ruby: [![Depfu](https://badges.depfu.com/badges/c9d769888ca0f35b0c244bda1e016bff/overview.svg)](https://depfu.com/repos/Zetatango/foghorn?project_id=6635) NPM: [![Depfu](https://badges.depfu.com/badges/776b62c147fae36eca2dbf0b3112a89f/overview.svg)](https://depfu.com/repos/Zetatango/foghorn?project_id=6636)

# README
This repo for based on [foghorn](https://github.com/Zetatango/foghorn) that has had Angular 12 upgraded.

## Modifications
1. window.opener with (window as any).opener
2. import emojiRegex from 'emoji-regex/es2015' instead of * as emojiRegex/es2015
3. allowSyntheticDefaultImports: true in the tsconfig.js
4. import { throwError } from 'rxjs/internal/observable/throwError'
5. nullified import 'Cryto' in place of import  * as crype from 'crypto-js';
6. new script flag: (--configuration production)


