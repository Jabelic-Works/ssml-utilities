import { Container } from "@cloudflare/containers";

export class AnalyzeContainer extends Container {
  defaultPort = 8080;
  sleepAfter = "10m";
  enableInternet = false;
}
