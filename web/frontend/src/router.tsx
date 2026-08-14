import { Link, Outlet, Router, Route, RootRoute } from '@tanstack/react-router'
import styled from 'styled-components'

// Layout Styled Components
const Navigation = styled.nav`
  display: flex;
  gap: 1.5rem;
  padding: 1rem 2rem;
  background-color: #1a1a1a;
  border-bottom: 1px solid #333;
`

const NavLink = styled(Link)`
  color: #fff;
  text-decoration: none;
  font-weight: 500;
  opacity: 0.8;
  transition: opacity 0.2s;

  &.active {
    opacity: 1;
    color: #646cff;
    font-weight: 700;
  }

  &:hover {
    opacity: 1;
  }
`

const MainContainer = styled.main`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
  color: #e0e0e0;
`

// Root Layout definition
const rootRoute = new RootRoute({
  component: () => (
    <>
      <Navigation>
        <NavLink to="/">Home</NavLink>
        <NavLink to="/users">Users</NavLink>
      </Navigation>
      <MainContainer>
        <Outlet />
      </MainContainer>
    </>
  ),
})

// Home route component
const indexRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => (
    <div>
      <h1>Welcome to the Whale Shark Orchestrator</h1>
      <p style={{ color: '#aaa', marginTop: '0.5rem' }}>
        This frontend is built with React, TypeScript, Styled Components, and TanStack Router.
      </p>
    </div>
  ),
})

// Users Dashboard styled components
const UsersContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

const UserCard = styled.div`
  border: 1px solid #333;
  border-radius: 8px;
  padding: 1rem;
  background: #242424;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: border-color 0.25s;

  &:hover {
    border-color: #646cff;
  }
`

const RoleBadge = styled.span`
  background: #646cff;
  color: white;
  padding: 0.25rem 0.6rem;
  border-radius: 4px;
  font-size: 0.85rem;
  text-transform: uppercase;
  font-weight: bold;
`

// Users route component
const usersRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/users',
  component: () => {
    // Mock user data corresponding to domain types
    const users = [
      { id: 'usr_1', firstName: 'John', lastName: 'Doe', email: 'john@example.com', role: 'admin' },
      { id: 'usr_2', firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com', role: 'consumer' },
    ]

    return (
      <UsersContainer>
        <h1>Users Dashboard</h1>
        <p style={{ color: '#aaa', marginBottom: '1rem' }}>
          Registered users in the SQLite database:
        </p>
        {users.map((user) => (
          <UserCard key={user.id}>
            <div>
              <h3>{user.firstName} {user.lastName}</h3>
              <p style={{ color: '#888', fontSize: '0.9rem', margin: '0.2rem 0 0 0' }}>{user.email}</p>
            </div>
            <RoleBadge>{user.role}</RoleBadge>
          </UserCard>
        ))}
      </UsersContainer>
    )
  },
})

// Construct route tree
const routeTree = rootRoute.addChildren([indexRoute, usersRoute])

// Create and export the Router instance
export const router = new Router({ routeTree })

// Register the Router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
