<p>
  <img width="100%" src="https://assets.solidjs.com/banner?type=Primitives&background=tiles&project=Upload" alt="Solid Primitives Upload">
</p>

# @solid-primitives/upload

[![size](https://img.shields.io/bundlephobia/minzip/@solid-primitives/upload?style=for-the-badge)](https://bundlephobia.com/package/@solid-primitives/upload)
[![size](https://img.shields.io/npm/v/@solid-primitives/upload?style=for-the-badge)](https://www.npmjs.com/package/@solid-primitives/upload)
[![stage](https://img.shields.io/endpoint?style=for-the-badge&url=https%3A%2F%2Fraw.githubusercontent.com%2Fsolidjs-community%2Fsolid-primitives%2Fmain%2Fassets%2Fbadges%2Fstage-0.json)](https://github.com/solidjs-community/solid-primitives#contribution-process)

Primitive to make uploading files and making dropzones easier.

## Installation

```bash
npm install @solid-primitives/upload
# or
yarn add @solid-primitives/upload
```

## How to use it

### [createFileUploader](#createfileuploader)

```ts
// single files
const { files, selectFiles } = createFileUploader();
selectFiles([file] => console.log(file));

// multiple files
const { files, selectFiles } = createFileUploader({ multiple: true, accept: "image/*" });
selectFiles(files => files.forEach(file => console.log(file)));
```

### use:fileUploader directive

```ts
const [files, setFiles] = createSignal<UploadFile[]>([]);

<input
  type="file"
  multiple
  use:fileUploader={{
    userCallback: fs => fs.forEach(f => console.log(f)),
    setFiles,
  }}
/>;
```

### [createDropzone](#createdropzone)

```html
<div
  ref={dropzoneRef}
  style={{ width: "100px", height: "100px", background: "red" }}>
  Dropzone
</div>
```

```ts
const { setRef: dropzoneRef, files: droppedFiles } = createDropzone({
  onDrop: async files => {
    await doStuff(2);
    files.forEach(f => console.log(f));
  },
  onDragStart: files => files.forEach(f => console.log(f)),
  onDragOver: files => console.log("drag over"),
});
```

## Demo

Working example: https://primitives.solidjs.community/playground/upload
Source code: https://github.com/solidjs-community/solid-primitives/blob/main/packages/upload/dev/index.tsx

## Changelog

See [CHANGELOG.md](./CHANGELOG.md)
