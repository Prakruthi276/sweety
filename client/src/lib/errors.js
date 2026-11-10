// Turns an Axios error into { message, fields }. `fields` maps field name -> message
export function parseApiError(err) {
  if (!err?.response) {
    return { message: 'Cannot reach the server. Please try again.', fields: {} };
  }
  const data = err.response.data;
  const fields = {};
  if (Array.isArray(data?.errors)) {
    for (const e of data.errors) {
      if (e.field && !fields[e.field]) fields[e.field] = e.message;
    }
  }
  const hasFields = Object.keys(fields).length > 0;
  return {
    message: hasFields ? '' : data?.message || 'Something went wrong. Please try again.',
    fields,
  };
}
