export async function npmExists(
  packageName: string,
  version?: string,
  registry?: string,
) {
  registry = registry || 'https://registry.npmjs.org';
  while (registry.endsWith('/')) {
    registry = registry.slice(0, -1);
  }
  const registryUrl =
    `${registry}/${packageName}}` + (version ? `/${version}` : '');

  const response = await fetch(registryUrl, {
    method: 'GET',
  });

  if (response.status === 200) {
    const packageData: any = await response.json();
    return packageData.version;
  } else if (response.status === 404) {
    return '';
  } else {
    throw new Error(`Unexpected status code: ${response.status}`);
  }
}
