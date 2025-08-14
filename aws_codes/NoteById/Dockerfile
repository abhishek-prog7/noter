FROM public.ecr.aws/lambda/nodejs:18-x86_64

# Copy function code and package.json from src directory
COPY src/ ${LAMBDA_TASK_ROOT}/

# Install dependencies
WORKDIR ${LAMBDA_TASK_ROOT}
RUN npm install

# Set the CMD to your handler
CMD [ "index.handler" ]
