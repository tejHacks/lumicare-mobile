const fs = require("fs/promises");
const path = require("path");
const { createRunOncePlugin, withGradleProperties, withDangerousMod, withXcodeProject, withMainApplication, withSettingsGradle, IOSConfig } = require("expo/config-plugins");

const PLUGIN_NAME = "lumicare-onnx-model";
const MODEL_DESTINATION_NAME = "sclera_detector.onnx";

function withAndroidModel(config, modelPath) {
  if (process.env.EXPO_PUBLIC_ENABLE_LOCAL_MODEL === "true") {
    config = withGradleProperties(config, (modConfig) => {
      const architectures = modConfig.modResults.find(
        (item) => item.type === "property" && item.key === "reactNativeArchitectures",
      );
      const requestedArchitectures = process.env.LUMICARE_ANDROID_ARCHS || "arm64-v8a";
      if (architectures) {
        architectures.value = requestedArchitectures;
      } else {
        modConfig.modResults.push({
          type: "property",
          key: "reactNativeArchitectures",
          value: requestedArchitectures,
        });
      }
      return modConfig;
    });
  }
  config = withSettingsGradle(config, (modConfig) => {
    const includeLine = "include ':onnxruntime-react-native'";
    const projectLine = "project(':onnxruntime-react-native').projectDir = new File(settingsDir, '../node_modules/onnxruntime-react-native/android')";
    let contents = modConfig.modResults.contents;
    if (!contents.includes(includeLine)) {
      contents = contents.replace(/include ':app'/, `${includeLine}\n${projectLine}\n\ninclude ':app'`);
    } else if (!contents.includes(projectLine)) {
      contents = contents.replace(includeLine, `${includeLine}\n${projectLine}`);
    }
    modConfig.modResults.contents = contents;
    return modConfig;
  });
  config = withMainApplication(config, (modConfig) => {
    const importLine = "import ai.onnxruntime.reactnative.OnnxruntimePackage";
    const registration = "if (none { it is OnnxruntimePackage }) add(OnnxruntimePackage())";
    let contents = modConfig.modResults.contents;
    if (!contents.includes(importLine)) {
      contents = contents.replace(/(package [^\n]+\n)/, `$1\n${importLine}\n`);
    }
    if (!contents.includes(registration)) {
      contents = contents.replace(
        /(PackageList\(this\)\.packages\.apply\s*\{)/,
        `$1\n          ${registration}`,
      );
    }
    modConfig.modResults.contents = contents;
    return modConfig;
  });
  return withDangerousMod(config, ["android", async (modConfig) => {
    const source = path.resolve(modConfig.modRequest.projectRoot, modelPath);
    const targetDirectory = path.join(modConfig.modRequest.platformProjectRoot, "app", "src", "main", "assets");
    await fs.mkdir(targetDirectory, { recursive: true });
    await fs.copyFile(source, path.join(targetDirectory, MODEL_DESTINATION_NAME));
    return modConfig;
  }]);
}

function withIosModel(config, modelPath) {
  config = withDangerousMod(config, ["ios", (modConfig) => {
    const podfile = path.join(modConfig.modRequest.platformProjectRoot, "Podfile");
    let contents = require("fs").readFileSync(podfile, "utf8");
    const pod = "  pod 'onnxruntime-react-native', :path => '../node_modules/onnxruntime-react-native'";
    if (!contents.includes(pod)) {
      contents = contents.replace(/^(\s*target\s+.+\s+do\s*)$/m, `$1\n${pod}`);
      require("fs").writeFileSync(podfile, contents);
    }
    return modConfig;
  }]);
  return withXcodeProject(config, async (modConfig) => {
    const source = path.resolve(modConfig.modRequest.projectRoot, modelPath);
    const projectRoot = modConfig.modRequest.platformProjectRoot;
    const relativePath = path.relative(projectRoot, source).split(path.sep).join("/");
    IOSConfig.XcodeUtils.ensureGroupRecursively(modConfig.modResults, "Resources");
    IOSConfig.XcodeUtils.addResourceFileToGroup({
      filepath: relativePath,
      groupName: "Resources",
      project: modConfig.modResults,
      isBuildFile: true,
    });
    return modConfig;
  });
}

function withOnnxModel(config, { modelPath = "./assets/ml/sclera_detector.onnx" } = {}) {
  config = withAndroidModel(config, modelPath);
  config = withIosModel(config, modelPath);
  return config;
}

module.exports = createRunOncePlugin(withOnnxModel, PLUGIN_NAME, "1.0.0");
