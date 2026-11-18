process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
async function test() {
  const query = `query GetCategoryTree {
    categoryList {
      id
      name
      children {
        id
        name
        children {
          id
          name
          children {
            id
            name
            children {
              id
              name
            }
          }
        }
      }
    }
  }`;
  const res = await fetch('https://mcprod.gsfcarparts.com/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  });
  const data = await res.json();
  const root = data.data.categoryList[0];
  console.log('Root:', root.id, root.name);
  console.log('Root children:', root.children.map(c => ({ id: c.id, name: c.name })));
  const carParts = root.children.find(c => c.name.toLowerCase().includes('car parts')) || root.children[0];
  console.log('Car Parts children (Level 1):', carParts.children.map(c => ({ id: c.id, name: c.name, subCount: c.children?.length })));
  const braking = carParts.children.find(c => c.name.toLowerCase().includes('braking'));
  console.log('Braking children (Level 2):', braking.children.map(c => ({ id: c.id, name: c.name, leafCount: c.children?.length, leaves: c.children?.map(l => l.name) })));
}
test();
