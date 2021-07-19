/* istanbul ignore file */

import { FormControl, FormGroup, AbstractControl } from '@angular/forms';
import { ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

// FORMS --------------------------------------------------------------------------------

/** Helper function for pretty printing a single FormControl
 *
 * (Useful for debugging form unit tests.)
 *
 * @param acName The name of a asbtract control
 * @param ac An Abstract control from a FormGroup object
 */
export function prettyPrintFormControl(acName: string, ac: FormControl | AbstractControl): void {
  console.log(`${acName}
                | value: '${ac.value}'
                | isPristine: ${ac.pristine} | isTouched: ${ac.touched} | isdirty: ${ac.dirty}
                | isValid: ${ac.valid} | isInvalid: ${ac.invalid}
                | errors:`, ac.errors);
}

/** Helper function for pretty printing each controls of a FormGroup.
 *
 * (Useful for debugging form unit tests.)
 *
 * @param fg a FormGroup object.
 */
export function prettyPrintFormGroup(fg: FormGroup): void {
  Object.keys(fg.controls).forEach((controlName: string) => {
    prettyPrintFormControl(controlName, fg.controls[controlName]);
  });
}

// INPUT INTERACTIONS -------------------------------------------------------------------

export function sendInput(fixture: ComponentFixture<any>, cssSelector: string, value: string): Promise<any> { // eslint-disable-line
  const inputElement = fixture.debugElement.query(By.css(cssSelector)).nativeElement;

  // Note: focus & blur to simulate elements to be marked as touched
  inputElement.focus();
  inputElement.value = value;
  inputElement.dispatchEvent(new Event('input'));
  inputElement.blur();

  fixture.detectChanges();
  return fixture.whenStable();
}

export function getInput(fixture: ComponentFixture<any>, cssSelector: string): string { // eslint-disable-line
  const inputElement = fixture.debugElement.query(By.css(cssSelector)).nativeElement;
  return inputElement.value;
}

// CHARACTERS SETS ----------------------------------------------------------------------

export function charRangeFromChar(startChar = String.fromCharCode(32), endChar = String.fromCharCode(255)): string[] {
  const startIndex = startChar.charCodeAt(0);
  const endIndex = endChar.charCodeAt(0);
  const length = endIndex - startIndex + 1;

  const indexArray = Array.from(Array(length).keys()).map(i => i + startIndex);
  const charArray = indexArray.map(i => String.fromCharCode(i));
  return charArray;
}

export const ALL_CHARS = charRangeFromChar();
export const DIGIT_CHARS = charRangeFromChar('0', '9');
export const ALPHA_CHARS = [...charRangeFromChar('a', 'z'), ...charRangeFromChar('A', 'Z')];
export const SPECIAL_CHARS = ALL_CHARS.filter(c => ![...DIGIT_CHARS, ...ALPHA_CHARS].includes(c));

const EMOJIS_SMILEYS = '😀😃😄😁😆😅🤣😂🙂🙃😉😊😇🥰😍🤩😘😗☺😚😙😋😛😜🤪😝🤑🤗🤭🤫🤔🤐🤨😐😑😶😏😒🙄😬🤥😌😔😪🤤😴😷🤒🤕🤢🤮🤧🥵🥶🥴😵🤯🤠🥳😎🤓🧐😕😟🙁☹😮😯😲😳🥺😦😧😨😰😥😢😭😱😖😣😞😓😩😫😤😡😠🤬😈👿💀☠💩🤡👹👺👻👽👾🤖😺😸😹😻😼😽🙀😿😾💋👋🤚🖐✋🖖👌✌🤞🤟🤘🤙👈👉👆🖕👇☝👍👎✊👊🤛🤜👏🙌👐🤲🤝🙏✍💅🤳💪🦵🦶👂👃🧠🦷🦴👀👁👅👄👶🧒👦👧🧑👱👨🧔👱👨👨👨👨👩👱👩👩👩👩🧓👴👵'.split('');
const EMOJIS_PEOPLE = '🙍🙍🙍🙎🙎🙎🙅🙅🙅🙆🙆🙆💁💁💁🙋🙋🙋🙇🙇🙇🤦🤦🤦🤷🤷🤷👨👩👨👩👨👩👨👩👨👩👨👩👨👩👨👩👨👩👨👩👨👩👨👩👨👩👨👩👨👩👨👩👮👮👮🕵🕵🕵💂💂💂👷👷👷🤴👸👳👳👳👲🧕🤵👰🤰🤱👼🎅🤶🦸🦸🦸🦹🦹🦹🧙🧙🧙🧚🧚🧚🧛🧛🧛🧜🧜🧜🧝🧝🧝🧞🧞🧞🧟🧟🧟💆💆💆💇💇💇🚶🚶🚶🏃🏃🏃💃🕺🕴👯👯👯🧖🧖🧖🧘👭👫👬💏👨👩💑👨👩👪👨👨👨👨👨👨👨👨👨👨👩👩👩👩👩👨👨👨👨👨👩👩👩👩👩🗣👤👥👣🧳🌂☂🧵🧶👓🕶🥽🥼👔👕👖🧣🧤🧥🧦👗👘👙👚👛👜👝🎒👞👟🥾🥿👠👡👢👑👒🎩🎓🧢⛑💄💍💼'.split('');
const EMOJIS_ANIMAL_NATURE = '🙈🙉🙊💥💫💦💨🐵🐒🦍🐶🐕🐩🐺🦊🦝🐱🐈🦁🐯🐅🐆🐴🐎🦄🦓🐮🐂🐃🐄🐷🐖🐗🐽🐏🐑🐐🐪🐫🦙🦒🐘🦏🦛🐭🐁🐀🐹🐰🐇🐿🦔🦇🐻🐨🐼🦘🦡🐾🦃🐔🐓🐣🐤🐥🐦🐧🕊🦅🦆🦢🦉🦚🦜🐸🐊🐢🦎🐍🐲🐉🦕🦖🐳🐋🐬🐟🐠🐡🦈🐙🐚🐌🦋🐛🐜🐝🐞🦗🕷🕸🦂🦟🦠💐🌸💮🏵🌹🥀🌺🌻🌼🌷🌱🌲🌳🌴🌵🌾🌿☘🍀🍁🍂🍃🍄🌰🦀🦞🦐🦑🌍🌎🌏🌐🌑🌒🌓🌔🌕🌖🌗🌘🌙🌚🌛🌜☀🌝🌞⭐🌟🌠☁⛅⛈🌤🌥🌦🌧🌨🌩🌪🌫🌬🌈☂☔⚡❄☃⛄☄🔥💧🌊🎄✨🎋🎍'.split('');
const EMOJIS_FOOD_DRINK = '🍇🍈🍉🍊🍋🍌🍍🥭🍎🍏🍐🍑🍒🍓🥝🍅🥥🥑🍆🥔🥕🌽🌶🥒🥬🥦🍄🥜🌰🍞🥐🥖🥨🥯🥞🧀🍖🍗🥩🥓🍔🍟🍕🌭🥪🌮🌯🥙🍳🥘🍲🥣🥗🍿🧂🥫🍱🍘🍙🍚🍛🍜🍝🍠🍢🍣🍤🍥🥮🍡🥟🥠🥡🍦🍧🍨🍩🍪🎂🍰🧁🥧🍫🍬🍭🍮🍯🍼🥛☕🍵🍶🍾🍷🍸🍹🍺🍻🥂🥃🥤🥢🍽🍴🥄'.split('');
const EMOJIS_ACTIVITIES = '🕴🧗🧗🧗🏇⛷🏂🏌🏌🏌🏄🏄🏄🚣🚣🚣🏊🏊🏊⛹⛹⛹🏋🏋🏋🚴🚴🚴🚵🚵🚵🤸🤸🤸🤼🤼🤼🤽🤽🤽🤾🤾🤾🤹🤹🤹🧘🧘🧘🎪🛹🎗🎟🎫🎖🏆🏅🥇🥈🥉⚽⚾🥎🏀🏐🏈🏉🎾🥏🎳🏏🏑🏒🥍🏓🏸🥊🥋⛳⛸🎣🎽🎿🛷🥌🎯🎱🎮🎰🎲🧩♟🎭🎨🧵🧶🎼🎤🎧🎷🎸🎹🎺🎻🥁🎬🏹'.split('');
const EMOJIS_TRAVEL_PLACES = '🚣🗾🏔⛰🌋🗻🏕🏖🏜🏝🏞🏟🏛🏗🏘🏚🏠🏡🏢🏣🏤🏥🏦🏨🏩🏪🏫🏬🏭🏯🏰💒🗼🗽⛪🕌🕍⛩🕋⛲⛺🌁🌃🏙🌄🌅🌆🌇🌉🎠🎡🎢🚂🚃🚄🚅🚆🚇🚈🚉🚊🚝🚞🚋🚌🚍🚎🚐🚑🚒🚓🚔🚕🚖🚗🚘🚚🚛🚜🏎🏍🛵🚲🛴🚏🛤⛽🚨🚥🚦🚧⚓⛵🚤🛳⛴🛥🚢✈🛩🛫🛬💺🚁🚟🚠🚡🛰🚀🛸🌠🌌⛱🎆🎇🎑💴💵💶💷🗿🛂🛃🛄🛅'.split('');
const EMOJIS_OBJECTS = '💌🕳💣🛀🛌🔪🏺🗺🧭🧱💈🛢🛎🧳⌛⏳⌚⏰⏱⏲🕰🌡⛱🧨🎈🎉🎊🎎🎏🎐🧧🎀🎁🔮🧿🕹🧸🖼🧵🧶🛍📿💎📯🎙🎚🎛📻📱📲☎📞📟📠🔋🔌💻🖥🖨⌨🖱🖲💽💾💿📀🧮🎥🎞📽📺📷📸📹📼🔍🔎🕯💡🔦🏮📔📕📖📗📘📙📚📓📃📜📄📰🗞📑🔖🏷💰💴💵💶💷💸💳🧾✉📧📨📩📤📥📦📫📪📬📭📮🗳✏✒🖋🖊🖌🖍📝📁📂🗂📅📆🗒🗓📇📈📉📊📋📌📍📎🖇📏📐✂🗃🗄🗑🔒🔓🔏🔐🔑🗝🔨⛏⚒🛠🗡⚔🔫🛡🔧🔩⚙🗜⚖🔗⛓🧰🧲⚗🧪🧫🧬🔬🔭📡💉💊🚪🛏🛋🚽🚿🛁🧴🧷🧹🧺🧻🧼🧽🧯🚬⚰⚱🗿🚰'.split('');
const EMOJIS_SYMBOLS = '💘💝💖💗💓💞💕💟❣💔❤🧡💛💚💙💜🖤💯💢💬👁🗯💭💤💮♨💈🛑🕛🕧🕐🕜🕑🕝🕒🕞🕓🕟🕔🕠🕕🕡🕖🕢🕗🕣🕘🕤🕙🕥🕚🕦🌀♠♥♦♣🃏🀄🎴🔇🔈🔉🔊📢📣📯🔔🔕🎵🎶🏧🚮🚰♿🚹🚺🚻🚼🚾⚠🚸⛔🚫🚳🚭🚯🚱🚷🔞☢☣⬆↗➡↘⬇↙⬅↖↕↔↩↪⤴⤵🔃🔄🔙🔚🔛🔜🔝🛐⚛🕉✡☸☯✝☦☪☮🕎🔯♈♉♊♋♌♍♎♏♐♑♒♓⛎🔀🔁🔂▶⏩◀⏪🔼⏫🔽⏬⏹⏏🎦🔅🔆📶📳📴♾♻🔱📛🔰⭕✅☑✔✖❌❎➕➖➗➰➿〽✳✴❇‼⁉❓❔❕❗©®™#🔟🔠🔡🔢🔣🔤🅰🆎🅱🆑🆒🆓ℹ🆔Ⓜ🆕🆖🅾🆗🅿🆘🆙🆚🈁🈂🈷🈶🈯🉐🈹🈚🈲🉑🈸🈴🈳㊗㊙🈺🈵🔴🔵⚫⚪⬛⬜◼◻◾◽▪▫🔶🔷🔸🔹🔺🔻💠🔳🔲'.split('');
const EMOJIS_FLAGS = '🏁🚩🎌🏴🏳🏳️‍🌈🏴‍☠️🇦🇨🇦🇩🇦🇪🇦🇫🇦🇬🇦🇮🇦🇱🇦🇲🇦🇴🇦🇶🇦🇷🇦🇸🇦🇹🇦🇺🇦🇼🇦🇽🇦🇿🇧🇦🇧🇧🇧🇩🇧🇪🇧🇫🇧🇬🇧🇭🇧🇮🇧🇯🇧🇱🇧🇲🇧🇳🇧🇴🇧🇶🇧🇷🇧🇸🇧🇹🇧🇻🇧🇼🇧🇾🇧🇿🇨🇦🇨🇨🇨🇩🇨🇫🇨🇬🇨🇭🇨🇮🇨🇰🇨🇱🇨🇲🇨🇳🇨🇴🇨🇵🇨🇷🇨🇺🇨🇻🇨🇼🇨🇽🇨🇾🇨🇿🇩🇪🇩🇬🇩🇯🇩🇰🇩🇲🇩🇴🇩🇿🇪🇦🇪🇨🇪🇪🇪🇬🇪🇭🇪🇷🇪🇸🇪🇹🇪🇺🇫🇮🇫🇯🇫🇰🇫🇲🇫🇴🇫🇷🇬🇦🇬🇧🇬🇩🇬🇪🇬🇫🇬🇬🇬🇭🇬🇮🇬🇱🇬🇲🇬🇳🇬🇵🇬🇶🇬🇷🇬🇸🇬🇹🇬🇺🇬🇼🇬🇾🇭🇰🇭🇲🇭🇳🇭🇷🇭🇹🇭🇺🇮🇨🇮🇩🇮🇪🇮🇱🇮🇲🇮🇳🇮🇴🇮🇶🇮🇷🇮🇸🇮🇹🇯🇪🇯🇲🇯🇴🇯🇵🇰🇪🇰🇬🇰🇭🇰🇮🇰🇲🇰🇳🇰🇵🇰🇷🇰🇼🇰🇾🇰🇿🇱🇦🇱🇧🇱🇨🇱🇮🇱🇰🇱🇷🇱🇸🇱🇹🇱🇺🇱🇻🇱🇾🇲🇦🇲🇨🇲🇩🇲🇪🇲🇫🇲🇬🇲🇭🇲🇰🇲🇱🇲🇲🇲🇳🇲🇴🇲🇵🇲🇶🇲🇷🇲🇸🇲🇹🇲🇺🇲🇻🇲🇼🇲🇽🇲🇾🇲🇿🇳🇦🇳🇨🇳🇪🇳🇫🇳🇬🇳🇮🇳🇱🇳🇴🇳🇵🇳🇷🇳🇺🇳🇿🇴🇲🇵🇦🇵🇪🇵🇫🇵🇬🇵🇭🇵🇰🇵🇱🇵🇲🇵🇳🇵🇷🇵🇸🇵🇹🇵🇼🇵🇾🇶🇦🇷🇪🇷🇴🇷🇸🇷🇺🇷🇼🇸🇦🇸🇧🇸🇨🇸🇩🇸🇪🇸🇬🇸🇭🇸🇮🇸🇯🇸🇰🇸🇱🇸🇲🇸🇳🇸🇴🇸🇷🇸🇸🇸🇹🇸🇻🇸🇽🇸🇾🇸🇿🇹🇦🇹🇨🇹🇩🇹🇫🇹🇬🇹🇭🇹🇯🇹🇰🇹🇱🇹🇲🇹🇳🇹🇴🇹🇷🇹🇹🇹🇻🇹🇼🇹🇿🇺🇦🇺🇬🇺🇲🇺🇳🇺🇸🇺🇾🇺🇿🇻🇦🇻🇨🇻🇪🇻🇬🇻🇮🇻🇳🇻🇺🇼🇫🇼🇸🇽🇰🇾🇪🇾🇹🇿🇦🇿🇲🇿🇼🏴󠁧󠁢󠁥󠁮󠁧󠁿🏴󠁧󠁢󠁳󠁣󠁴󠁿🏴󠁧󠁢󠁷󠁬󠁳󠁿🏳️‍⚧️🏴󠁵󠁳󠁴󠁸󠁿'.split('');

export const ALL_EMOJIS = [
  ...EMOJIS_SMILEYS,
  ...EMOJIS_PEOPLE,
  ...EMOJIS_ANIMAL_NATURE,
  ...EMOJIS_FOOD_DRINK,
  ...EMOJIS_ACTIVITIES,
  ...EMOJIS_TRAVEL_PLACES,
  ...EMOJIS_OBJECTS,
  ...EMOJIS_SYMBOLS,
  ...EMOJIS_FLAGS
];
