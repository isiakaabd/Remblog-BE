const welcomeMessage = (username) => {
  return `
<h3>Dear ${username ? username : "Friend"},</h3>

 We're thrilled to welcome you to RemBlog, your new online destination for all things blogging. Whether you're a seasoned writer or just dipping your toes into the world of blogging, RemBlog is here to support and inspire you on your journey.

With a vibrant community of writers, readers, and thinkers, RemBlog offers a platform to share your thoughts, insights, and stories with the world. Explore a wide range of topics, engage in discussions, and connect with like-minded individuals who share your passions.

Here are a few things you can do on RemBlog:

<ul>
<li>Create and publish your own blog posts.</li>
<li>Discover and read thought-provoking articles from fellow bloggers.</li>
<li>Connect with other writers and readers by commenting and engaging in discussions.</li>
<li>Customize your profile to showcase your interests and expertise.</li>
<li>Gain valuable insights and feedback to improve your writing skills.</li>
</ul>

<p><strong>We're excited to have you join our community and can't wait to see what you'll bring to the table. If you have any questions, need assistance, or simply want to say hello, feel free to reach out to us.</strong></p>

<p><Strong>Welcome to RemBlog – where your words come to life.<strong></p>
<br>
<br>
<br>
Best regards,
<p><strong>The RemBlog Team </strong></p>`;
};
export { welcomeMessage };
