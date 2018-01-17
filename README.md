# tcomb-form-native-builder-components
Set of extra formats, transformers and types for
[tcomb-form-native](https://github.com/gcanti/tcomb-form-native)

This module provide some extra components for `tcomb-form-native` used by
[tcomb-form-native-builder](https://github.com/QuantumBA/tcomb-form-native-builder).
Note that they could make use of some customizations and optimizations provided
by it, making them incompatible with standard `tcomb-form-native`.

## Factories

Factories are responsible of drawing the UI component and do the data
transformations to serialize the info transparent to the user.

### Chips

Allow to get a list of strings as a set of
[chips](https://material.io/guidelines/components/chips.html) buttons.

- style
  - **chipContainer**: style of the *chip* button
  - **rootElement**: style of the *chip* buttons wrapper container

### File

Open a platform native file selector, and give an URI to operate with it.

- style
  - **formGroup**: style of the wrapper container
  - **helpBlock**: style of the help info label
  - **errorBlock**: style of the error info label
- **type**: `mime` type of the files that can be selected. Default: all files

### Image

Show a static image, for example a company logo.

- style
- **uri**: location of the image file

### Submit

- **contentType**: format how the form info will be send to the server. By
  default, it will be send as `multipart/form-data`, but you can also set it as
  `application/json`.
- style
  - **formGroup**: style of the wrapper container
  - **helpBlock**: style of the help info label
  - **errorBlock**: style of the error info label
- **uri**: address where to `POST` the form info

## Transformers

Objects with methods to do the serialization (`format`) and deserialization
(`parse`) between the in-wire data format and the one used on the UI components,
in case they need to be different for some reason.

### arrayStringsFactory(splitter, joiner)

Factory of transformers between a list of strings and a tokenized string. By
default, it will split and join using whitespaces.

## Types

[tcomb](https://github.com/gcanti/tcomb) types with an associated
[custom factory](#Factories) to use with
[tcomb-json-schema](https://github.com/gcanti/tcomb-json-schema). Currently
there's one for each one of the [factories](#factories).

## Formats

Functions to validate if strings are of a specific format. Current available
ones are `date` and `email`.

## processSchema(json)

Special function that accept an extended version of the `tcomb` schema and
transform it in a regular one.

### select

Extension of `select` component, allowing to define an `uri` pointing to a JSON
resource with the entries of the `select` component, and to define the entries
as a list of objects.

- **uri**: alias of `meta.uri` option.
- meta
  - **fieldId**: if entries are defined as a list of objects, path to the value
    to be used as `id`. Default: `id`.
  - **fieldLabel**: if entries are defined as a list of objects, path to the
    value to be used as `label`. Default: `label`.
  - **placeholders**: object mapping the `uri` placeholders with their actual
    value to be used.
  - **uri**: location of the JSON file with the entries of the `select`. entries
    can be defined as a list of strings, a mapping object with formatted as
    `value:label`, or a list of objects with fields `id` and `value`. It can be
    a templated string and make use of placeholders to be fully generated.
