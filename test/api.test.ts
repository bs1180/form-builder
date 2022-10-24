import { describe, expect, it } from "vitest";
import {
  newForm,
  setName,
  addField,
  setValue,
  getValue,
  setFieldOptions,
  addValidationRule,
  validate,
  isEmail,
  getValues,
  setDefaultVisibility,
  addConditionalRule,
  checkVisibility,
} from "..";
import * as R from "ramda";

describe("Building a form", () => {
  it("Set the name", () => {
    const form = setName("Example Form", newForm());
    expect(form.name).toEqual("Example Form");
  });

  it("Add a field", () => {
    const form = addField("text", "given_name", newForm());
    expect(form.fields).toEqual([{ type: "text", name: "given_name" }]);
  });

  it("Set field options", () => {
    const form = R.pipe(
      addField("select", "favourite_colour"),
      setFieldOptions("favourite_colour", ["red", "green", "blue"])
    )(newForm());

    expect(form).toEqual({
      name: "",
      fields: [
        {
          type: "select",
          name: "favourite_colour",
          options: ["red", "green", "blue"],
        },
      ],
    });
  });
});

describe("Completing a form", () => {
  it("Set a field value", () => {
    const form = R.pipe(
      addField("text", "given_name"),
      setValue("given_name", "Ben")
    )(newForm());

    expect(form.fields[0].value).toBe("Ben");
  });

  it("Get a field value", () => {
    const form = R.pipe(
      addField("text", "given_name"),
      setValue("given_name", "John")
    )(newForm());

    expect(getValue("given_name", form)).toBe("John");
  });

  it("Get all values from form", () => {
    const form = R.pipe(
      addField("text", "given_name"),
      setValue("given_name", "Max"),
      addField("text", "family_name"),
      setValue("family_name", "Musterman")
    )(newForm());

    expect(getValues(form)).toEqual({
      given_name: "Max",
      family_name: "Musterman",
    });
  });
});

describe("Validation", () => {
  it("Set a validation rule", () => {
    const form = R.pipe(
      addField("text", "name"),
      addValidationRule("name", R.identity)
    )(newForm());

    expect(form.fields[0].validationRules.length).toEqual(1);
  });

  it("Run the validation rules and pass successfully", () => {
    const form = R.pipe(
      addField("text", "email"),
      addValidationRule("email", isEmail),
      setValue("email", "ben@example.com"),
      validate
    )(newForm());

    expect(form.fields[0].errors.length).toEqual(0);
  });

  it("Run the validation rules and fails successfully", () => {
    const form = R.pipe(
      addField("text", "email"),
      addValidationRule("email", isEmail),
      setValue("email", "not_an_email"),
      validate
    )(newForm());

    expect(form.fields[0].errors).toEqual(["Not a valid email"]);
  });
});

describe("Conditional fields", () => {
  it("Set default visibility", () => {
    const form = R.pipe(
      addField("text", "favourite_colour"),
      addField("text", "favourite_shade_of_pink"),
      setDefaultVisibility("favourite_shade_of_pink", false)
    )(newForm());

    expect(form).toEqual({
      name: "",
      fields: [
        {
          type: "text",
          name: "favourite_colour",
        },
        {
          type: "text",
          name: "favourite_shade_of_pink",
          defaultVisibility: false,
        },
      ],
    });
  });

  it("Set a conditional rule", () => {
    const rule = R.propEq("favourite_colour", "pink");

    const form = R.pipe(
      addField("text", "favourite_shade_of_pink"),
      addConditionalRule("favourite_shade_of_pink", rule)
    )(newForm());

    expect(form.fields[0].conditionalRules.length).toEqual(1);
  });

  it("Apply conditional validation", () => {
    const rule = R.propEq("favourite_colour", "pink");

    const form = R.pipe(
      addField("text", "favourite_colour"),
      addField("text", "favourite_shade_of_pink"),
      setDefaultVisibility("favourite_shade_of_pink", false),
      addConditionalRule("favourite_shade_of_pink", rule),
      setValue("favourite_colour", "green"),
      checkVisibility
    )(newForm());

    expect(form.fields[1].visible).toEqual(false);

    const updatedForm = R.pipe(
      setValue("favourite_colour", "pink"),
      checkVisibility
    )(form);

    expect(updatedForm.fields[1].visible).toEqual(true);
  });
});
