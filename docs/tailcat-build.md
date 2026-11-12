# Tailcat browser assets

The application serves pinned tailcat WASM and its matching Go runtime from `personal-ui/public/tailcat/`. Normal Astro builds copy these assets without requiring Go or downloading executable scripts. Load them only when device transfer is opened: the compressed module is approximately 6 MiB.

## Rebuild

Install or unpack the official **Go 1.27.2** toolchain, then run from the repository root:

```sh
node personal-ui/scripts/build-tailcat.mjs
```

If Go is outside `PATH`, set `TAILCAT_GO` to its executable. The builder requires the exact toolchain, verifies the pinned source archive SHA-256, uses upstream WASM feature tags with `-trimpath`, validates the decompressed module, and writes the assets, linked-module license notices and provenance hashes. It downloads Go modules through the normal Go module verification mechanism. It does not install a toolchain or change system configuration.

Initial build on 2026-11-12 used the official `go1.27.2.darwin-arm64.tar.gz`, downloaded into a temporary directory. Its SHA-256 was verified against [Go's download metadata](https://go.dev/dl/?mode=json&include=all): `76812b213b1b2302c978d28fa52fa92d541704b9e7d9d5db8002c50e4018c4c5`.

Tailcat source revision and output hashes are in `personal-ui/public/tailcat/provenance.json`. The source archive hash is pinned in the builder. Upgrade the source revision and hash deliberately, then repeat transport and browser checks; a new WASM module requires the runtime from the same Go toolchain.

## Loader contract

Load the local `wasm_exec.js` script and create `new Go()`. Fetch automatically decompresses responses with `Content-Encoding: gzip` (as served by Astro); use that response body directly. Otherwise decompress the raw `main.wasm.gz` bytes with `DecompressionStream('gzip')` (as on GitHub Pages). Instantiate the resulting module with the Go import object. Set `globalThis.onTailcatReady` before running it; that callback signals that `tailcatListen` and `tailcatDial` are available. Use the app's configured base path for both asset URLs.

The module runs indefinitely after registering its browser bridge. A completed or cancelled transfer must close its listener/connections; it does not terminate the shared Go runtime. The upstream bridge allocates JavaScript callbacks for connections, so repeated long-lived use should be checked for memory growth before treating this experimental implementation as a continuous sync service.

Browser traffic uses DERP relays rather than direct UDP. This build proves compilation and local asset validity, not relay availability or physical phone interoperability. [Upstream bridge](https://github.com/tailscale/tailcat/blob/e00cdde6ff787f801361ff85ed085775c775d4c5/web/main_js.go) · [Upstream build](https://github.com/tailscale/tailcat/blob/e00cdde6ff787f801361ff85ed085775c775d4c5/internal/wasmbuild/wasmbuild.go).
