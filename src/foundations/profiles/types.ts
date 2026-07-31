export interface DesignProfileSpacing {
  unit?: string;
  space1?: string;
  space2?: string;
  space3?: string;
  space4?: string;
  space5?: string;
  space6?: string;
  space8?: string;
  space10?: string;
  space12?: string;
}

export interface DesignProfileRadius {
  size?: string;
  medium?: string;
  large?: string;
  xlarge?: string;
  control?: string;
  field?: string;
  nav?: string;
  pill?: string;
}

export interface DesignProfileDensity {
  panelPadding?: string;
  panelGap?: string;
  overlayPadding?: string;
  overlayItemPadding?: string;
  overlayItemMinHeight?: string;
  modalPadding?: string;
  modalWidth?: string;
  drawerWidth?: string;
  controlHeight?: string;
  controlHeightLarge?: string;
  controlPaddingInline?: string;
  inputPadding?: string;
  selectHeight?: string;
  disabledOpacity?: string;
}

export interface DesignProfileTypography {
  fontFamilyBase?: string;
  controlFontSize?: string;
  controlLetterSpacing?: string;
  modalTitleSize?: string;
}

export interface DesignProfileElevation {
  panel?: string;
  overlay?: string;
  modal?: string;
  inputInset?: string;
  primaryFocus?: string;
}

export interface DesignProfileMotion {
  fast?: string;
  interactive?: string;
  medium?: string;
  slow?: string;
  spin?: string;
  shimmer?: string;
  easingStandard?: string;
  easingEnter?: string;
  easingExit?: string;
  easingLinear?: string;
}

export interface DesignProfileDefinition {
  name: string;
  description?: string;
  spacing?: DesignProfileSpacing;
  radius?: DesignProfileRadius;
  density?: DesignProfileDensity;
  typography?: DesignProfileTypography;
  elevation?: DesignProfileElevation;
  motion?: DesignProfileMotion;
  customProperties?: Record<`--${string}`, string>;
}

export interface DesignProfileChangeDetail {
  profileName: string;
}

export interface DesignProfileController {
  start(): void;
  stop(): void;
  setProfile(name: string): void;
  getProfile(): string;
}

export interface DesignProfileControllerOptions {
  root?: HTMLElement;
  profile?: string;
  registerBuiltIns?: boolean;
  profileAttribute?: string | null;
  storageKey?: string | null;
  storage?: Storage | null;
}

export interface ApplyDesignProfileOptions {
  selector?: string;
}
