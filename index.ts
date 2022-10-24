import * as R from "ramda";
import type { FieldType, Form, ValidationRule } from "./types";

const formNameLens = R.lensProp("name");

const fieldsLens = R.lensProp("fields");

// Return a lens focused on a specific field
const field = (fieldName) => {
  return R.lens(
    R.find(R.propEq("name", fieldName)),
    (val, arr, idx = R.findIndex(R.propEq("name", fieldName), arr)) =>
      R.update(idx > -1 ? idx : R.length(arr), val, arr)
  );
};

export const newForm = (): Form => ({
  name: "",
  fields: [],
});

export const setName = R.curry((name: string, form: Form) => {
  return R.set(formNameLens, name, form);
});

export const getName = R.curry((form: Form) => R.get(formNameLens, form));

export const addField = R.curry((type: FieldType, name: string, form) => {
  return R.over(fieldsLens, R.append({ type, name }), form);
});

export const getValue = R.curry((fieldName: string, form: Form) => {
  const lens = R.compose(fieldsLens, field(fieldName), R.lensProp("value"));
  return R.view(lens, form);
});

export const setValue = R.curry(
  (fieldName: string, value: string, form: Form) => {
    const lens = R.compose(fieldsLens, field(fieldName), R.lensProp("value"));
    return R.set(lens, value, form);
  }
);

export const setFieldOptions = R.curry(
  (fieldName: string, options: string[], form: Form) => {
    const lens = R.compose(fieldsLens, field(fieldName), R.lensProp("options"));
    return R.set(lens, options, form);
  }
);

const EMAIL_REGEX = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

export const isEmail = (value) =>
  EMAIL_REGEX.test(value) ? undefined : "Not a valid email";

const minLength = R.curry((min: number, value) =>
  value.length < min ? undefined : "Too short!"
);

export const addValidationRule = R.curry(
  (fieldName: string, rule: ValidationRule, form: Form) => {
    const lens = R.compose(
      fieldsLens,
      field(fieldName),
      R.lensProp("validationRules")
    );
    return R.over(lens, R.append(rule), form);
  }
);

export const validate = (form: Form) => {
  const fields = form.fields.map((field) => {
    const errors = (field.validationRules ?? [])
      .map((rule) => rule(field.value))
      .filter(Boolean);
    return {
      ...field,
      errors,
    };
  });
  return {
    ...form,
    fields,
  };
};

export const addConditionalRule = R.curry(
  (fieldName: string, rule: ValidationRule, form: Form) => {
    const lens = R.compose(
      fieldsLens,
      field(fieldName),
      R.lensProp("conditionalRules")
    );
    return R.over(lens, R.append(rule), form);
  }
);

export const getValues = (form: Form) =>
  form.fields.reduce(
    (prev, cur) => ({
      ...prev,
      [cur.name]: cur.value,
    }),
    {}
  );

export const checkVisibility = (form: Form) => {
  const values = getValues(form);

  const fields = form.fields.map((field) => {
    const visible = field.conditionalRules
      ? field.conditionalRules.some((rule) => rule(values))
      : true;

    return {
      ...field,
      visible,
    };
  });
  return {
    ...form,
    fields,
  };
};

export const setDefaultVisibility = R.curry(
  (fieldName: string, visibility: boolean, form: Form) => {
    const lens = R.compose(
      fieldsLens,
      field(fieldName),
      R.lensProp("defaultVisibility")
    );

    return R.set(lens, visibility, form);
  }
);
