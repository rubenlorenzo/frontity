import execa from "execa";

jest.setTimeout(120000);

const testContainer = (callback: (containerId: string) => any) => async () => {
  let containerId: string;
  try {
    containerId = await startContainer();
    await callback(containerId);
  } finally {
    await execa.command(`docker rm --force ${containerId}`, {
      stdio: "ignore",
    });
  }
};

beforeAll(async () => {
  // Remove the built output
  await execa.command("rm -rf build", { stdio: "inherit" });

  // Compile the TS source to JS
  await execa.command("npm run build", { stdio: "inherit" });

  // Run `npm pack`
  const { stdout: artifactName } = await execa.command("npm pack", {
    stdio: "pipe", // `pipe` because we want to get the name of the tarball generated by npm pack
  });

  // Build the "base" docker container that contains our CLI
  await execa.command(
    `docker build -t frontity-cli --build-arg ARTIFACT_NAME=${artifactName} .`,
    {
      stdio: "inherit",
    }
  );

  await execa.command(`rm ${artifactName}`);
});

test(
  "print tree",
  testContainer(async (containerId) => {
    await execa.command(
      `docker exec -i ${containerId} node_modules/.bin/frontity create --no-prompt --theme @frontity/mars-theme test-frontity-app`,
      {
        stdio: "inherit",
      }
    );

    const output = runCommand("tree test-frontity-app", containerId);
    expect(output).toMatchInlineSnapshot();
  })
);

/**
 * Start a container and return its ID.
 *
 * @returns The ID of the container.
 */
const startContainer = async () => {
  // start the container
  const { stdout: containerId } = await execa.command(
    "docker run --rm -i -d frontity-cli node",
    {
      stdio: "pipe",
    }
  );
  return containerId;
};

/**
 *  Run an arbitrary command in a container.
 *
 * @param cmd - The command to execute.
 * @param containerId - The ID of the container.
 *
 * @returns Stdout returned from the command.
 */
const runCommand = async (cmd: string, containerId: string) => {
  const { stdout } = execa.commandSync(
    `docker exec -i ${containerId} sh -c "${cmd}"`,
    {
      stdio: "pipe",
    }
  );
  return stdout;
};
