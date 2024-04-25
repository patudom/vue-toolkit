/** Class representing a background imageset for WorldWide Telescope */
export class BackgroundImageset {
  public imagesetName: string;
  public displayName: string;

  /**
    * Create a background imageset
    * @param{string} displayName - The outward-facing name to use for the imageset
    * @param{string} imagesetName - The name of the imageset object inside WorldWideTelescope
    */
  constructor(displayName: string, imagesetName: string) {
    this.displayName = displayName;
    this.imagesetName = imagesetName;
  }
}

/** A default list of `BackgroundImagset` objects to use within data stories */
export const skyBackgroundImagesets: BackgroundImageset[] = [
  new BackgroundImageset(
    "Optical (Terapixel DSS)",
    "Digitized Sky Survey (Color)"
  ),
  new BackgroundImageset(
    "Low-frequency radio (VLSS)",
    "VLSS: VLA Low-frequency Sky Survey (Radio)"
  ),
  new BackgroundImageset("Infrared (2MASS)", "2Mass: Imagery (Infrared)"),
  new BackgroundImageset("Infrared (SFD dust map)", "SFD Dust Map (Infrared)"),
  new BackgroundImageset("Ultraviolet (GALEX)", "GALEX (Ultraviolet)"),
  new BackgroundImageset(
    "X-Ray (ROSAT RASS)",
    "RASS: ROSAT All Sky Survey (X-ray)"
  ),
  new BackgroundImageset(
    "Gamma Rays (FERMI LAT 8-year)",
    "Fermi LAT 8-year (gamma)"
  ),
];
