{
  description = "L'Ouvriere landing page";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-26.05";

  outputs = { self, nixpkgs, ... }:
    let
      package = builtins.fromJSON (builtins.readFile ./package.json);
      systems = [
        "aarch64-darwin"
        "aarch64-linux"
        "x86_64-darwin"
        "x86_64-linux"
      ];
      forAllSystems = nixpkgs.lib.genAttrs systems;
    in
    {
      devShells = forAllSystems (system:
        let
          pkgs = import nixpkgs { inherit system; };
        in
        {
          default = pkgs.mkShell {
            packages = [ pkgs.nodejs_22 ];
          };
        });

      packages = forAllSystems (system:
        let
          pkgs = import nixpkgs { inherit system; };
          npmDeps = pkgs.importNpmLock { npmRoot = self; };
        in
        {
          doc = pkgs.stdenvNoCC.mkDerivation {
            pname = "ouvriere-guide";
            version = package.version;
            src = self;
            nativeBuildInputs = [ pkgs.mdbook ];

            buildPhase = ''
              mdbook build docs --dest-dir "$out"
            '';

            installPhase = "true";
          };

          default = pkgs.buildNpmPackage {
            pname = "ouvriere";
            version = package.version;
            src = self;
            nodejs = pkgs.nodejs_22;
            inherit npmDeps;
            npmConfigHook = pkgs.importNpmLock.npmConfigHook;

            nativeBuildInputs = [
              pkgs.pkg-config
              pkgs.python3
            ];
            buildInputs = [ pkgs.vips ];

            # Sharp otherwise fetches libvips from GitHub during a sandboxed Nix
            # build. Remove this once the locked install stops downloading libvips
            # outside the lockfile; `nix build .#` verifies that retirement.
            SHARP_FORCE_GLOBAL_LIBVIPS = "1";

            buildPhase = ''
              runHook preBuild
              npm run build
              runHook postBuild
            '';

            installPhase = ''
              runHook preInstall
              cp -r dist "$out"
              runHook postInstall
            '';
          };
        });
    };
}
