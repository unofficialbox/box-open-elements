// This unit has only the native-types import: root/JSX imports cannot mask drift.
import type { BoxElementProperties } from "@unofficialbox/box-open-elements/native-types";

const properties: BoxElementProperties<"box-process-modeler"> = {
  fields: {step: [
    {key: 'time', label: 'Time', kind: 'time', value: '09:00'},
    {key: 'at', label: 'At', kind: 'datetime-local', value: ''},
    {key: 'json', label: 'Request', kind: 'multiline', value: '{}', rows: 4, format: 'code'},
    {key: 'count', label: 'Count', kind: 'number', value: '', min: 1, max: 10, step: 'any'},
  ]},
  connectionsHelp: "Connections are set up by the host.",
};
const help: string | undefined = properties.connectionsHelp;
// @ts-expect-error host help is plain text
const invalid: BoxElementProperties<"box-process-modeler"> = { connectionsHelp: 42 };
void [properties, help, invalid];
