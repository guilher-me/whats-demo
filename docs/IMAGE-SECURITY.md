# Contact image security

User photos are untrusted input, including photos received through a shared link, localStorage or the automation API. Base64 is an encoding, not sanitization. The implementation follows the layered approach in the [OWASP File Upload Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html).

## Processing boundary

1. Only embedded PNG, JPEG and WebP are accepted. No uploaded SVG, HTML, GIF, arbitrary asset paths, external URL, `file:` or `blob:` source is accepted. The file input's MIME filter is only a convenience; it is not the security check.
2. `core/images/policy.ts` strictly parses the data URL and canonical Base64, caps input at 2 MiB and reads real headers with [image-dimensions](https://github.com/sindresorhus/image-dimensions). Each edge must be at most 4096 pixels, with at most 8 million pixels in total. These checks happen before browser image decoding.
3. `core/images/sanitize.ts` also identifies binary format with [file-type](https://github.com/sindresorhus/file-type); the result must agree with the declared MIME and header format. Signatures alone do not prove that a file is valid or harmless.
4. The native browser decoder must successfully decode the image. Decoded dimensions are checked again. A fresh Canvas receives only pixels and exports a static PNG with a maximum 512-pixel edge. Original metadata, animation and trailing bytes are not copied. The output is checked again.
5. `SafeAvatar` displays the fallback until processing succeeds. It never assigns an unprocessed user source to `img.src`, even during synchronous automation loads. Stale asynchronous results are ignored after replacement. Uploads, inbound links, recovered drafts and outbound share URLs all use the same boundary. Rejected photos become the default avatar; valid journey content is preserved.

Decoders run sequentially, with at most four pending inputs, duplicate requests share work, and the successful-result cache is bounded to eight entries. A decode has an eight-second deadline, and late bitmaps are closed. Canvas and bitmap resources are released after use. A timeout stops waiting; it cannot forcibly interrupt a native browser decoder. No background network service, antivirus upload or backend is used. Both libraries are pinned and embedded in the portable HTML.

The exact bundled Luma Home and legacy Prevent Senior assets are trusted application resources. Their two historic `assets/` aliases remain supported. This exception does not allow other uploaded SVGs or arbitrary paths. Old links keep project version 1; an unsupported old photo is removed without rejecting the conversation. The synchronous automation API v1 performs header validation; image decoding/rewriting happens asynchronously before display and sharing. Invalid photos can therefore disappear after `loadProject()` returns.

## Limits of this protection

This reduces attack surface; it is not malware detection or a guarantee against unknown browser decoder vulnerabilities. Rewriting necessarily decodes the input. Keep browsers and dependencies updated, preserve limits before decoding, and never render untrusted images as inline SVG, HTML, `object` or `iframe`. The limits apply to contact photos, not to every other journey field. They do not make the entire application a general-purpose HTML sanitizer.

Regression tests cover spoofed MIME, active content, disallowed URLs and paths, malformed Base64, byte/pixel limits, rewrite and cleanup, decoder failures/timeouts, stale rendering and old link compatibility. Real browser checks should accompany changes to decoding or Canvas behavior.
