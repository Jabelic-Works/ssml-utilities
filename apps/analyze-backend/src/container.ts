import { Container } from "@cloudflare/containers";

export class AnalyzeContainer extends Container {
  defaultPort = 8080;
  sleepAfter = "10m";
  enableInternet = false;
  envVars = {
    PORT: "8080",
    MECABRC: "/etc/mecabrc",
    MECAB_DICDIR: "/var/lib/mecab/dic/unidic",
    UNIDIC_DIR: "/var/lib/mecab/dic/unidic",
    MECAB_OUTPUT_FORMAT: "unidic22",
  };
}
