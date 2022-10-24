## Custom Form API

I would implement the required API as a set of functions that modify a single form object. This is a functional programming approach that is well suited to our particular requirements: we are performing a series of independent manipulations upon a set of data that be treated as an immutable single object. This is inspired by [Elixir Ecto changesets](https://hexdocs.pm/ecto/Ecto.Changeset.html).

### Building the form

The basic design is that we would have a form object, with space for a name and an ordered array of field configs.

```
const form = {
name: '',
fields: []
}
```

We would add new fields in a functional fashion:

```
const originalForm = newForm()

const updatedForm = addField("text","given_name", originalForm)

```

Our functional programming approach allows additional utilities to be created using partial application and composition

```
const addTextField = addField("text")

const addBooleanField = addField("boolean")

const addSelectField = (name, options) => R.pipe(
  addField("select", name),
  setFieldOptions(name, options)
)
```

Although not implemented apart from `setName`, we could add all manner of additional utilities (`moveFieldUp`, `deleteField`, `setLabel` etc.) which follow the same pattern of taking a form input, applying immutable transformations, and returning an updated form.

## Completing the form

We can use the same technique to actually fill out our form, with essentially a set of getters and setters being applied to our form.

```
const completeForm = (givenName, familyName) => R.pipe(
  setFieldValue("given_name", givenName),
  setFieldValue("family_name", familyName)
)

const updatedForm = completeForm("John", "Doe")(form)

console.log(getFieldValues(updatedForm))

-> output is {"given_name":"John", "family_name": "Doe"}

```

## Rendering the form

Although only the bare API is implemented here, it would be straightforward to implement a UI using the available tools. Additional metadata (eg. `label`, `widget`) could be added to help customisation.

## Validation

Having proposed our fundamental technique and implemented the basic requirements, we can examine the more advanced functionality.

For the field types, it can be observed that plain text and email fields represent the same data (a scalar string), and only the validation and potentially UI metadata would differ. The file field type is fundamentally the same (although skipped now due to time).

By implementing a sensible validation technique, we can therefore model a very wide range of data, meeting both the current requirements and allowing future expansion.

For our validation, we can implement it as a function that takes the field value and returns either a string error message or undefined. This allows us to create complex validations by chaining simple rules:

```
const minLength = (min) => (val) => val.length < min ? 'Too short!' : undefined

const maxLength = (max) => (val) => val.length > max ? 'Too long!' : undefined

addValidationRule("password", minLength(6))
addValidationRule("password", maxLength(255))

```

In the case of an email, we can use a simple Regexp to validate. And again, we can use functional composition to build specific utilities:

```
const addEmailField = (fieldName) => R.pipe(
  addField("text", fieldName),
  addValidationRule(fieldName, isEmail)
  setUIAppearance("email_widget")
)

```

Validation of our form is carrying out by evaluating all these validation functions and setting the errors, where appropriate (`validate`). In our UI it would be trivial to collect these errors and display accordingly.

### Conditional fields

We can use a similar technique to display conditional fields. This time our functions take all the form values and return a boolean. Our `checkVisibility` function iterates over all the fields and sets the `visible` field on each one. Again, in our UI it would be trivial to show or hide the field accordingly.

### Persistence

Although outside the scope of this exercise, it's worth considering how persistence could be achieved. The API proposed here is completely independent of how the form would be saved, and there are a range of different possibilities. The immutable nature of the API keeps it simple.

```
const form = await getFormById()

// ...update the form using above techniques

await saveForm(id, updatedForm)

// ...or if the form has been filled out
const values = getValues(updatedForm)

await saveFormSubmission(values)

```

### Other considerations

It can be observed that there are really two separate contexts - we begin with a design stage (when a user builds the form out of different fields) and then a separate completion stage (when a different user fills the form out). In this writeup I've mixed the two, but we easily split up our functions .

```
import { addField } from './design'
import { setFieldValue } from './complete'
```

### Weaknesses

- I've focused on the overall shape of the API and the function signatures - the implementations could no doubt be improved.
- I've made no effort at validating the inputs - in reality, an error should be thrown if, for example, a fieldName doesn't exist when setting its value.
- I've made only minimal attempts at adding Typescript definitions, and Ramda's incomplete definitions don't help. With more time, agumenting each of the functions definitions with the specific types would be an easy win.
- This has a completely synchronous design. Although perfect for a FE UI, async validation is very common (eg. checking against a banned list of words via an external API).
- Purely functional programming is relatively rare in Javascript, so may be unfamilar to many developers and uncommon in most codebases.

### Conclusion

In conclusion, I think the API proposed exceeds the stated requirements, allowing a form to be both designed and filled out. Extending the exposed API via composition and partial application would also be simple, allowing for a succinct and hopefully pleasant developer experience. The immutable nature of the functions makes unit testing straightforward and reliable.
By modelling validation and conditional fields as an array of functions, we unlock a tremendous amount of additional capability - new field types and very advanced form designs are already possible.
