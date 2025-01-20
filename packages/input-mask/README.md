<p>
  <img width="100%" src="https://assets.solidjs.com/banner?type=Primitives&background=tiles&project=Input%20Mask" alt="Solid Primitives Input Mask">
</p>

# @solid-primitives/input-mask

[![size](https://img.shields.io/bundlephobia/minzip/@solid-primitives/input-mask?style=for-the-badge&label=size)](https://bundlephobia.com/package/@solid-primitives/input-mask)
[![version](https://img.shields.io/npm/v/@solid-primitives/input-mask?style=for-the-badge)](https://www.npmjs.com/package/@solid-primitives/input-mask)
[![stage](https://img.shields.io/endpoint?style=for-the-badge&url=https%3A%2F%2Fraw.githubusercontent.com%2Fsolidjs-community%2Fsolid-primitives%2Fmain%2Fassets%2Fbadges%2Fstage-1.json)](https://github.com/solidjs-community/solid-primitives#contribution-process)

Primitive that returns an event handler to mask the inputs of a text input element (`<input>`, `<textarea>`) when applied in `oninput` or `onchange` and set attributes to handle pattern display.

## Installation

```bash
npm install @solid-primitives/input-mask
# or
yarn add @solid-primitives/input-mask
```

## Usage

For convenience reasons, the handler returns the current value, which allows you to use it to fill a signal or assign a let variable. The masks come in 4 different formats: function, regex-replacer, array and string. There are tools to convert string masks to array masks and regex-replacer and array masks to function masks.

```tsx
import {
  stringMaskToArray,
  regexMaskToFn,
  arrayMaskToFn,
  anyMaskToFn,
  createInputMask,
  stringMaskRegExp,
} from "@solid-primitives/input-mask";
// string mask:
// 9 = any number,
// 0 = any number (optional),
// a = any letter,
// z = any letter (optional),
// * = any alphanumeric character,
// ? = any alphanumeric character (optional)
// any other letter becomes a fixed placeholder
// this list of replacements for string masks is exported as
// stringMaskRegExp, so you can add your own regex to it
// add "u" for upper case letters:
stringMaskRegExp.u = /[A-Z]/;
const isodate = "9999-99-99";
// array mask: RegExp to match variable parts, strings for fixed placeholders
const meetingId = [/\d/, /\d/, /\d/, "-", /\d/, /\d/, /\d/, "-", /\d/, /\d/, /\d/]);
// regex replacer mask: a RegExp to match parts and a function to replace them
// with the output of a function:
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace#specifying_a_function_as_the_replacement
const meetingName = [
  /[^0-9a-zäöüß\-_/]|^(https?:\/\/|)(www\.|)(meet\.goto\.com|gotomeet\.me|)\/?/gi,
  () => ""
];
// function mask: (value, [start, end]) => [value, [start, end]]
const meetingIdOrName = (value, selection) =>
  (/^\d{1,3}$|^\d{2,4}-?\d{0,3}$|^\d{2,4}-?\d{2,4}-?\d{0,3}$/.test(value)
    ? anyMaskToFn(meetingId)
    : anyMaskToFn(meetingName)
  )(value, selection);

// converting string mask to array:
const maskArrayFromString = stringMaskToArray(maskString);
// converting other formats to function:
const maskFuncFromArray = arrayMaskToFn(maskArray);
const maskFuncFromRegexReplacer = regexMaskToFn(regexMask, replacerFn);
const maskFuncFromAny = anyMaskToFn(mask);

// use let variable, store, mutable or signal to get value in event:
let changeMaskValue = "";
// use ref to get the value:
let inputMaskRef;
const inputMask = {
  ref,
  get value() {
    return inputMask.ref?.value;
  }
};

const dateMask = createInputMask("99/99/9999");

return (
  <>
    <label for="changeMask">The mask will only be applied after you leave the field</label>
    <input
      type="text"
      id="changeMask"
      onchange={e => {
        changeMaskValue = dateMask(e);
      }}
    />
    <label for="inputMask">The mask will be applied on every single input</label>
    <input type="text" id="inputMask" ref={inputMask.ref} oninput={dateMask} onPaste={dateMask} />
  </>
);
```

In most cases you'll want to use `onInput` and `onPaste`.

## Showing the pattern during input

The placeholder attribute is nice, but it cannot show the pattern during input. In order to rectify this shortcoming, this package has a `createMaskPattern` export:

```tsx
import { createInputMask, createMaskPattern } from "@solid-primitives/input-mask";

return (
  <>
    <label for="datefield">ISO Date:</label>
    <div>
      <label for="datefield" id="datefield-pattern-view"></label>
      <input
        id="datefield"
        placeholder="YYYY-MM-DD"
        onInput={createMaskPattern(createInputMask("9999-99-99"), () => "YYYY-MM-DD")}
      />
    </div>
  </>
);
```

This uses something like the following CSS to make sure that the empty label:

```css
input {
  border: 0.1rem solid currentColor;
  padding: 0.5rem 0.75rem;
}
/* make sure the pattern text is displayed at the exact position of the input text */
label[data-mask-value] {
  position: absolute;
  border: 0.1rem solid transparent;
  padding: 0.5rem 0.75rem;
}
/* Render the value in a transparent color to move the pattern to the correct position */
label[data-mask-value]::before {
  content: attr(data-mask-value);
  color: transparent;
}
/* Render the visible pattern after the invisible value */
label[data-mask-pattern]::after {
  content: attr(data-mask-pattern);
  opacity: 0.7;
}
```

As you can see, this function requires an empty label as `previousElementSibling` to the input field, which will be automatically given two attributes, `data-mask-value` and `data-mask-pattern`, which can be used to display the pattern over the input. This label must be formatted so that its content will match the text in the adjacent input; use a transparent border and padding to achieve this effect. You need not use an inline style; you can also use your favorite way to deploy the CSS (e.g. tailwind or solid-styled).

## Usage with form handling libraries

To use the mask handler with [`solid-js-form`](https://github.com/niliadu/solid-js-form), you need to steer clear of the `use:formHandler` directive, as it overwrites the input event with DOM level 2 events. Instead, use the `handleChange`and `handleBlur` event handlers instead:

```tsx
// don't
const { field, form } = useField(props.name);
const formHandler = form.formHandler;
<input onInput={inputMask} use:formHandler />;

// do
const { field, form } = useField(props.name);
<input onBlur={form.handleBlur} onInput={ev => (inputMask(ev), form.handleChange(ev))} />;
```

To use the mask handler with [Modular Forms](https://modularforms.dev/), from version 0.13.1, you can use its [Transform inputs API](https://modularforms.dev/solid/guides/transform-inputs):

```tsx
<Field name="ccard" transform={toCustom((_, event) => ccmask(event), { on: "input" })}>
  {(field, props) => <input {...props} value={field.value} />}
</Field>
```

For older versions than 0.13.x which don't support this helpful API, you may need to overwrite the re-validation handler:

```tsx
<Field of={…} name={…}>
  {(field) =>
    <input
      {...field.props}
      onInput={ev => (inputMask(ev), field.props.onInput.?(ev))}
    />}
</Field>
```

The usage with [solid-form-handler](https://solid-form-handler.com/) is pretty similar:

```tsx
const formHandler = useFormHandler(...);

return <Field
  mode="input"
  name="email"
  formHandler={formHandler}
  render={(field) => (
    <>
      <label class="form-label" for={field.props.id}>
        Email
      </label>
      <input
        {...field.props}
        class="form-control"
        classList={{ 'is-invalid': field.helpers.error }}
        onInput={ev => (inputMask(ev), field.props.onInput.?(ev))}
      />
      <Show when={field.helpers.error}>
        <div class="invalid-feedback">{field.helpers.errorMessage}</div>
      </Show>
    </>
  )}
/>;
```

With [solar-forms](https://github.com/kajetansw/solar-forms), the only way to use the mask handler at the moment is to use the `keyup` instead of the `input` event, since this library seizes total control over the latter. If you're the author and want to change this, either [open an issue](https://github.com/solidjs-community/solid-primitives/issues) or ping me (Alex Lohr) on the Solid.js discord.

## FAQ

- **Why not support `contenteditable`?**<br> In most reasonable cases, you won't need it. In those rare cases you do need it, check the [selection](../selection/README.md) package, it shows you how to employ the mask filter functions together with a selection that supports `contenteditable`.
- **Why `oninput`/`onchange` instead of e.g. `onkeyup`?**<br> There are a few things happening after `keydown`, `keypress` and `keyup`, which would result in flickering. Generally, you could use `onblur`, but then you'd attempt to apply the mask even if nothing changed, which just seems unnecessarily wasteful.
- **Will it work with actual events?**<br> Yes, it will work with composed as well as native events, even with React's synthetic events; `createInputMask` has an optional generic that you can use to type the output events. Solid's composed events are more performant than DOM events, so it is best practice to use them.
- **Is there a server version?**<br> No, since it only creates an event handler that will solely run on the client; it makes no sense to create a server version.
- **Does this provide any error handling?**<br> There is no error handling, but it should work well together with any form handling library.
- **Can I limit the events this uses?**<br> If you want to limit the events this uses e.g. as part of a library or to use this with another framework's events while you port your app to solid, we got you covered, you can just call `createInputMask<EventTypeUnion>(mask)` in order to do exactly that.
- **Can I change the string mask handling?**<br> As a matter of fact, you can! Either use the second optional parameter of `stringMaskToArray(mask[, regexps])` or `anyMaskToFn(mask[, regexps])` or `import { stringMaskRegExp } from "@solid-primitives/input-mask"` and change it to your liking.
- **Can I turn this off and on again?**<br> You can still wrap the output handler in your own handler to turn it off and on again:

```jsx
import { createInputMask } from "@solid-primitives/input-mask";

let ref;
let useMask = false;
const mask = createInputMask("9999-99-99");
return <input ref={ref} onInput={e => useMask && mask(e)} onPaste={e => useMask && mask(e)} />;
```

### DEMO

Here is a [working demonstration](https://primitives.solidjs.community/playground/input-mask/) ([Source code](https://github.com/solidjs-community/solid-primitives/tree/main/packages/input-mask/dev)).

## Changelog

See [CHANGELOG.md](./CHANGELOG.md)
