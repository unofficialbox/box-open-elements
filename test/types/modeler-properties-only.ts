// This unit has only the native-types import: root/JSX imports cannot mask drift.
import type { BoxElementProperties } from "@unofficialbox/box-open-elements/native-types";

const properties: BoxElementProperties<"box-process-modeler"> = {
  connectionsHelp: "Connections are set up by the host.",
};
const help: string | undefined = properties.connectionsHelp;
// @ts-expect-error host help is plain text
const invalid: BoxElementProperties<"box-process-modeler"> = { connectionsHelp: 42 };
void [properties, help, invalid];
